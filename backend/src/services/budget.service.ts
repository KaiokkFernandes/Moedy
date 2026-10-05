import { addMonths, endOfMonth, monthKey, todayInSaoPaulo } from "../lib/dates.js";
import { monthName } from "../lib/format.js";
import { merchantKey } from "../lib/merchant.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middlewares/errorHandler.js";
import type { BudgetInput, CopyBudgetsInput, MonthInput, MonthQuery } from "../schemas/budget.schema.js";
import { type Period, recurring, reportWhere, totalsByCategory } from "./report.service.js";

export type BudgetStatus = "OK" | "ATENCAO" | "ESTOURADO";

const ATENCAO_PERCENT = 80;
/** Sugestões são a média dos últimos 3 meses, arredondada para cima em múltiplos de R$ 10. */
const SUGGESTION_MONTHS = 3;
const SUGGESTION_STEP = 1000;

const categorySelect = { id: true, nome: true, cor: true, icone: true } as const;
const SEM_CATEGORIA = { nome: "Sem categoria", cor: "#94a3b8", icone: "tag" };

function monthPeriod({ mes, ano }: MonthInput): Period {
  const inicio = new Date(Date.UTC(ano, mes - 1, 1));
  return { inicio, fim: endOfMonth(inicio) };
}

/** Sem mês/ano, o mês atual no fuso de São Paulo. */
export function resolveMonth({ mes, ano }: MonthQuery): MonthInput {
  if (mes !== undefined && ano !== undefined) return { mes, ano };
  const today = todayInSaoPaulo();
  return { mes: today.getUTCMonth() + 1, ano: today.getUTCFullYear() };
}

function percentage(gasto: number, limite: number): number {
  return Math.round((gasto / limite) * 1000) / 10;
}

// Comparação em inteiros, para 80% e 100% exatos caírem do lado certo sem depender de arredondamento
function statusOf(gasto: number, limite: number): BudgetStatus {
  if (gasto >= limite) return "ESTOURADO";
  if (gasto * 100 >= limite * ATENCAO_PERCENT) return "ATENCAO";
  return "OK";
}

/**
 * Quanto do gasto do mês, por categoria, vem de cobranças fixas (assinaturas, aluguel...).
 * Elas não se repetem ao longo do mês, então não entram no "ritmo" usado na projeção.
 */
async function fixedChargesByCategory(userId: string, period: Period) {
  const [{ recorrentes }, groups] = await Promise.all([
    recurring(userId, { meses: 12 }),
    prisma.transaction.groupBy({
      by: ["categoryId", "descricao"],
      where: { ...reportWhere(userId, undefined, period), tipo: "DESPESA" },
      _sum: { valor: true },
    }),
  ]);

  const recurringKeys = new Set(recorrentes.map((item) => item.chave));
  const fixed = new Map<string, number>();
  for (const group of groups) {
    if (!group.categoryId || !recurringKeys.has(merchantKey(group.descricao))) continue;
    fixed.set(group.categoryId, (fixed.get(group.categoryId) ?? 0) + (group._sum.valor ?? 0));
  }
  return fixed;
}

/**
 * Projeção de fechamento: as cobranças fixas contam uma vez, e o restante do gasto é
 * projetado no ritmo atual (gasto por dia até hoje × dias do mês).
 */
function project(gasto: number, fixo: number, limite: number, today: Date) {
  const diasNoMes = endOfMonth(today).getUTCDate();
  const variavel = Math.max(0, gasto - fixo);
  const valor = Math.min(gasto, fixo) + Math.round((variavel * diasNoMes) / today.getUTCDate());
  return { valor, vaiEstourar: gasto < limite && valor > limite };
}

export async function list(userId: string, query: MonthQuery) {
  const month = resolveMonth(query);
  const period = monthPeriod(month);
  const today = todayInSaoPaulo();
  const mesAtual = monthKey(period.inicio) === monthKey(today);

  const [budgets, totals, fixed] = await Promise.all([
    prisma.budget.findMany({ where: { userId, ...month }, include: { category: { select: categorySelect } } }),
    // A mesma soma do relatório por categoria: só despesas, sem as transações ignoradas
    totalsByCategory(userId, period),
    mesAtual ? fixedChargesByCategory(userId, period) : undefined,
  ]);

  const gastoDe = (categoryId: string | null) =>
    totals.find((group) => group.categoryId === categoryId)?._sum.valor ?? 0;

  const orcamentos = budgets
    .map((budget) => {
      const gasto = gastoDe(budget.categoryId);
      return {
        id: budget.id,
        categoryId: budget.categoryId,
        categoria: budget.category,
        mes: budget.mes,
        ano: budget.ano,
        valorLimite: budget.valorLimite,
        gasto,
        /** Negativo quando o orçamento estourou. */
        restante: budget.valorLimite - gasto,
        percentual: percentage(gasto, budget.valorLimite),
        status: statusOf(gasto, budget.valorLimite),
        /** Só no mês atual: nos outros, o mês já fechou ou ainda não começou. */
        projecao: fixed ? project(gasto, fixed.get(budget.categoryId) ?? 0, budget.valorLimite, today) : null,
      };
    })
    // Os mais perto (ou além) do limite primeiro
    .sort((a, b) => b.percentual - a.percentual || a.categoria.nome.localeCompare(b.categoria.nome));

  // Categorias que tiveram gasto no mês e não têm orçamento
  const budgeted = new Set(budgets.map((budget) => budget.categoryId));
  const unbudgeted = totals.filter((group) => !group.categoryId || !budgeted.has(group.categoryId));
  const categories = await prisma.category.findMany({
    where: { userId, id: { in: unbudgeted.flatMap((group) => (group.categoryId ? [group.categoryId] : [])) } },
    select: categorySelect,
  });

  const semOrcamento = unbudgeted
    .map((group) => {
      const category = categories.find((item) => item.id === group.categoryId) ?? SEM_CATEGORIA;
      return {
        categoryId: group.categoryId,
        nome: category.nome,
        cor: category.cor,
        icone: category.icone,
        gasto: group._sum.valor ?? 0,
      };
    })
    .sort((a, b) => b.gasto - a.gasto || a.nome.localeCompare(b.nome));

  const totalOrcado = orcamentos.reduce((sum, item) => sum + item.valorLimite, 0);
  const totalGasto = orcamentos.reduce((sum, item) => sum + item.gasto, 0);

  return {
    ...month,
    mesAtual,
    resumo: {
      totalOrcado,
      /** Gasto nas categorias que têm orçamento. */
      totalGasto,
      restante: totalOrcado - totalGasto,
      percentual: totalOrcado === 0 ? 0 : percentage(totalGasto, totalOrcado),
      gastoSemOrcamento: semOrcamento.reduce((sum, item) => sum + item.gasto, 0),
    },
    orcamentos,
    semOrcamento,
  };
}

async function findOwned(userId: string, id: string) {
  const budget = await prisma.budget.findFirst({ where: { id, userId } });
  if (!budget) {
    throw new AppError("Orçamento não encontrado", 404);
  }
  return budget;
}

/** A categoria precisa ser do usuário e de despesa, e só pode ter um orçamento por mês. */
async function assertValid(userId: string, input: BudgetInput, ignoreId?: string) {
  const category = await prisma.category.findFirst({ where: { id: input.categoryId, userId } });
  if (!category) {
    throw new AppError("Categoria não encontrada", 404);
  }
  if (category.tipo !== "DESPESA") {
    throw new AppError("Só categorias de despesa podem ter orçamento", 400);
  }

  const duplicate = await prisma.budget.findFirst({
    where: { userId, categoryId: input.categoryId, mes: input.mes, ano: input.ano, id: { not: ignoreId } },
  });
  if (duplicate) {
    throw new AppError(
      `Já existe um orçamento de ${category.nome} em ${monthName(input.mes)} de ${input.ano}`,
      409,
    );
  }
}

const include = { category: { select: categorySelect } };

export async function create(userId: string, input: BudgetInput) {
  await assertValid(userId, input);
  return prisma.budget.create({ data: { ...input, userId }, include });
}

export async function update(userId: string, id: string, input: BudgetInput) {
  await findOwned(userId, id);
  await assertValid(userId, input, id);
  return prisma.budget.update({ where: { id }, data: input, include });
}

export async function remove(userId: string, id: string) {
  await findOwned(userId, id);
  await prisma.budget.delete({ where: { id } });
}

/** Copia os orçamentos de um mês para outro, sem mexer nos que já existem no destino. */
export async function copy(userId: string, { deMes, deAno, paraMes, paraAno }: CopyBudgetsInput) {
  const source = await prisma.budget.findMany({ where: { userId, mes: deMes, ano: deAno } });
  if (source.length === 0) {
    throw new AppError(`Não há orçamentos em ${monthName(deMes)} de ${deAno} para copiar`, 400);
  }

  // O índice único (usuário, categoria, mês, ano) faz o skipDuplicates preservar os existentes
  const { count } = await prisma.budget.createMany({
    skipDuplicates: true,
    data: source.map(({ categoryId, valorLimite }) => ({ userId, categoryId, valorLimite, mes: paraMes, ano: paraAno })),
  });

  return { copiados: count, ignorados: source.length - count };
}

/**
 * Sugestão de limite por categoria de despesa: a média mensal do gasto nos 3 meses
 * anteriores ao mês pedido, arredondada para cima em múltiplos de R$ 10.
 */
export async function suggestions(userId: string, query: MonthQuery) {
  const month = resolveMonth(query);
  const { inicio } = monthPeriod(month);
  const period = { inicio: addMonths(inicio, -SUGGESTION_MONTHS), fim: endOfMonth(addMonths(inicio, -1)) };

  const [categories, totals, budgets] = await Promise.all([
    prisma.category.findMany({ where: { userId, tipo: "DESPESA" }, select: categorySelect, orderBy: { nome: "asc" } }),
    totalsByCategory(userId, period),
    prisma.budget.findMany({ where: { userId, ...month }, select: { categoryId: true } }),
  ]);
  const budgeted = new Set(budgets.map((budget) => budget.categoryId));

  return {
    ...month,
    sugestoes: categories.map((category) => {
      const total = totals.find((group) => group.categoryId === category.id)?._sum.valor ?? 0;
      const media = Math.round(total / SUGGESTION_MONTHS);
      return {
        categoryId: category.id,
        nome: category.nome,
        cor: category.cor,
        icone: category.icone,
        /** Gasto médio por mês nos últimos 3 meses. */
        media,
        /** `null` quando não houve gasto para basear a sugestão. */
        sugestao: media > 0 ? Math.ceil(media / SUGGESTION_STEP) * SUGGESTION_STEP : null,
        temOrcamento: budgeted.has(category.id),
      };
    }),
  };
}

/** Cria, de uma vez, os orçamentos sugeridos para as categorias que ainda não têm um no mês. */
export async function createFromSuggestions(userId: string, month: MonthInput) {
  const { sugestoes } = await suggestions(userId, month);

  const { count } = await prisma.budget.createMany({
    skipDuplicates: true,
    data: sugestoes.flatMap((item) =>
      item.sugestao && !item.temOrcamento
        ? [{ userId, categoryId: item.categoryId, valorLimite: item.sugestao, ...month }]
        : [],
    ),
  });

  return { criados: count };
}
