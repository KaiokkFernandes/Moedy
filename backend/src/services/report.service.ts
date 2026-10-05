import { Prisma, type TransactionType } from "../generated/prisma/client.js";
import {
  addDays,
  addMonths,
  endOfMonth,
  monthKey,
  monthsBetween,
  previousPeriod,
  startOfMonth,
  todayInSaoPaulo,
  toISODate,
} from "../lib/dates.js";
import { merchantKey, merchantName } from "../lib/merchant.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middlewares/errorHandler.js";
import type {
  ByCategoryQuery,
  CategoryTrendQuery,
  LargestExpensesQuery,
  MonthlyQuery,
  PeriodQuery,
  RecurringQuery,
  TopMerchantsQuery,
} from "../schemas/report.schema.js";
import { serializeTransaction, transactionInclude } from "./transaction.service.js";

/*
 * Regras comuns a todos os relatórios:
 * - só transações de contas do usuário (e da conta `accountId`, quando informada);
 * - transações marcadas com `ignorarNosRelatorios` (transferências, pagamento de fatura) ficam de fora;
 * - somas e agrupamentos são feitos pelo banco; aqui só se montam as respostas;
 * - "hoje" e o "mês atual" seguem o fuso America/Sao_Paulo. As datas das transações são dias
 *   puros (sem hora), então uma compra do dia 31 é sempre do dia 31, em qualquer fuso.
 */

const SEM_CATEGORIA = { nome: "Sem categoria", cor: "#94a3b8", icone: "tag" };

export interface Period {
  inicio: Date;
  fim: Date;
}

/** Sem datas, o período é o mês atual; com uma só, a outra ponta fica aberta até o início/fim do mês dela. */
function resolvePeriod({ dataInicio, dataFim }: PeriodQuery): Period {
  const reference = dataInicio ?? dataFim ?? todayInSaoPaulo();
  return { inicio: dataInicio ?? startOfMonth(reference), fim: dataFim ?? endOfMonth(reference) };
}

async function assertAccountOwned(userId: string, accountId: string | undefined) {
  if (!accountId) return;
  const account = await prisma.account.findFirst({ where: { id: accountId, userId } });
  if (!account) {
    throw new AppError("Conta não encontrada", 404);
  }
}

export function reportWhere(userId: string, accountId: string | undefined, { inicio, fim }: Period): Prisma.TransactionWhereInput {
  return {
    account: { userId },
    accountId,
    ignorarNosRelatorios: false,
    // `fim` é inclusivo: tudo antes do dia seguinte
    data: { gte: inicio, lt: addDays(fim, 1) },
  };
}

/** O mesmo filtro de `reportWhere`, para as consultas em SQL (tabelas `t` = Transaction, `a` = Account). */
function reportSqlFilter(userId: string, accountId: string | undefined, { inicio, fim }: Period) {
  return Prisma.sql`
    a."userId" = ${userId}
    AND t."ignorarNosRelatorios" = false
    AND t.data >= ${inicio} AND t.data < ${addDays(fim, 1)}
    ${accountId ? Prisma.sql`AND t."accountId" = ${accountId}` : Prisma.empty}`;
}

async function totalsByType(where: Prisma.TransactionWhereInput) {
  const groups = await prisma.transaction.groupBy({ by: ["tipo"], where, _sum: { valor: true } });
  const sum = (tipo: TransactionType) => groups.find((group) => group.tipo === tipo)?._sum.valor ?? 0;
  const receitas = sum("RECEITA");
  const despesas = sum("DESPESA");
  return { receitas, despesas, saldo: receitas - despesas };
}

/** Variação percentual com uma casa decimal; `null` quando não há base de comparação (anterior = 0). */
function variation(atual: number, anterior: number): number | null {
  if (anterior === 0) return null;
  return Math.round(((atual - anterior) / Math.abs(anterior)) * 1000) / 10;
}

function percentage(parte: number, total: number): number {
  return total === 0 ? 0 : Math.round((parte / total) * 1000) / 10;
}

/**
 * Saldo das contas considerando só as transações anteriores a `before` (ou todas, sem ele).
 * Diferente dos relatórios, aqui entram também as transações ignoradas: elas movimentam o saldo.
 */
async function accountsBalance(userId: string, accountId: string | undefined, before: Date) {
  const [accounts, movements] = await Promise.all([
    prisma.account.aggregate({ where: { userId, id: accountId }, _sum: { saldoInicial: true } }),
    prisma.transaction.groupBy({
      by: ["tipo"],
      where: { account: { userId }, accountId, data: { lt: before } },
      _sum: { valor: true },
    }),
  ]);
  const sum = (tipo: TransactionType) => movements.find((group) => group.tipo === tipo)?._sum.valor ?? 0;
  return (accounts._sum.saldoInicial ?? 0) + sum("RECEITA") - sum("DESPESA");
}

export async function summary(userId: string, query: PeriodQuery) {
  await assertAccountOwned(userId, query.accountId);
  const period = resolvePeriod(query);
  const previous = previousPeriod(period.inicio, period.fim);

  const [atual, anterior, saldoInicio, saldoFim] = await Promise.all([
    totalsByType(reportWhere(userId, query.accountId, period)),
    totalsByType(reportWhere(userId, query.accountId, previous)),
    accountsBalance(userId, query.accountId, period.inicio),
    accountsBalance(userId, query.accountId, addDays(period.fim, 1)),
  ]);

  return {
    periodo: { dataInicio: toISODate(period.inicio), dataFim: toISODate(period.fim) },
    ...atual,
    anterior: { dataInicio: toISODate(previous.inicio), dataFim: toISODate(previous.fim), ...anterior },
    variacao: {
      receitas: variation(atual.receitas, anterior.receitas),
      despesas: variation(atual.despesas, anterior.despesas),
      saldo: variation(atual.saldo, anterior.saldo),
    },
    /** Saldo das contas no começo e no fim do período (inclui transferências e o saldo inicial). */
    saldoContas: { inicio: saldoInicio, fim: saldoFim, variacao: variation(saldoFim, saldoInicio) },
  };
}

/**
 * Total e quantidade de transações por categoria no período, somados pelo banco.
 * É a regra única de "quanto foi gasto em uma categoria": os orçamentos usam a mesma função.
 */
export async function totalsByCategory(
  userId: string,
  period: Period,
  tipo: TransactionType = "DESPESA",
  accountId?: string,
) {
  return prisma.transaction.groupBy({
    by: ["categoryId"],
    where: { ...reportWhere(userId, accountId, period), tipo },
    _sum: { valor: true },
    _count: { _all: true },
  });
}

export async function byCategory(userId: string, query: ByCategoryQuery) {
  await assertAccountOwned(userId, query.accountId);
  const period = resolvePeriod(query);

  const groups = await totalsByCategory(userId, period, query.tipo, query.accountId);

  const categories = await prisma.category.findMany({
    where: { userId, id: { in: groups.flatMap((group) => (group.categoryId ? [group.categoryId] : [])) } },
    select: { id: true, nome: true, cor: true, icone: true },
  });

  const total = groups.reduce((sum, group) => sum + (group._sum.valor ?? 0), 0);

  return {
    periodo: { dataInicio: toISODate(period.inicio), dataFim: toISODate(period.fim) },
    tipo: query.tipo,
    total,
    categorias: groups
      .map((group) => {
        const category = categories.find((item) => item.id === group.categoryId) ?? SEM_CATEGORIA;
        const valor = group._sum.valor ?? 0;
        return {
          categoryId: group.categoryId,
          nome: category.nome,
          cor: category.cor,
          icone: category.icone,
          total: valor,
          percentual: percentage(valor, total),
          quantidade: group._count._all,
        };
      })
      .sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome)),
  };
}

interface MonthlyRow {
  mes: string;
  tipo: TransactionType;
  total: bigint;
  quantidade: bigint;
}

/** Totais por mês e tipo, somados pelo banco. `extra` acrescenta condições (ex.: uma categoria). */
async function monthlyTotals(userId: string, accountId: string | undefined, period: Period, extra = Prisma.empty) {
  return prisma.$queryRaw<MonthlyRow[]>`
    SELECT to_char(date_trunc('month', t.data), 'YYYY-MM') AS mes, t.tipo, SUM(t.valor) AS total, COUNT(*) AS quantidade
    FROM "Transaction" t
    JOIN "Account" a ON a.id = t."accountId"
    WHERE ${reportSqlFilter(userId, accountId, period)} ${extra}
    GROUP BY 1, 2`;
}

/** Os últimos `meses` meses até o mês de `dataFim` (padrão: o atual), ou de `dataInicio` a `dataFim`. */
function resolveMonths({ dataInicio, dataFim }: PeriodQuery, meses: number): Period {
  const lastMonth = startOfMonth(dataFim ?? todayInSaoPaulo());
  const firstMonth = dataInicio ? startOfMonth(dataInicio) : addMonths(lastMonth, -(meses - 1));
  if (monthsBetween(firstMonth, lastMonth).length > 60) {
    throw new AppError("O período máximo deste relatório é de 60 meses", 400);
  }
  return { inicio: firstMonth, fim: endOfMonth(lastMonth) };
}

export async function monthly(userId: string, query: MonthlyQuery) {
  await assertAccountOwned(userId, query.accountId);
  const period = resolveMonths(query, query.meses);
  const rows = await monthlyTotals(userId, query.accountId, period);

  const total = (mes: string, tipo: TransactionType) =>
    Number(rows.find((row) => row.mes === mes && row.tipo === tipo)?.total ?? 0);

  return {
    // Meses sem movimento entram com zero
    meses: monthsBetween(period.inicio, period.fim).map((month) => {
      const mes = monthKey(month);
      const receitas = total(mes, "RECEITA");
      const despesas = total(mes, "DESPESA");
      return { mes, receitas, despesas, saldo: receitas - despesas };
    }),
  };
}

export async function categoryTrend(userId: string, query: CategoryTrendQuery) {
  await assertAccountOwned(userId, query.accountId);

  let categoria: { id: string | null; nome: string; cor: string; icone: string; tipo: TransactionType };
  if (query.categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: query.categoryId, userId },
      select: { id: true, nome: true, cor: true, icone: true, tipo: true },
    });
    if (!category) {
      throw new AppError("Categoria não encontrada", 404);
    }
    categoria = category;
  } else {
    categoria = { id: null, ...SEM_CATEGORIA, tipo: query.tipo };
  }

  const period = resolveMonths(query, query.meses);
  const rows = await monthlyTotals(
    userId,
    query.accountId,
    period,
    categoria.id
      ? Prisma.sql`AND t."categoryId" = ${categoria.id}`
      : Prisma.sql`AND t."categoryId" IS NULL AND t.tipo = ${categoria.tipo}::"TransactionType"`,
  );

  return {
    categoria,
    meses: monthsBetween(period.inicio, period.fim).map((month) => {
      const row = rows.find((item) => item.mes === monthKey(month));
      return { mes: monthKey(month), total: Number(row?.total ?? 0), quantidade: Number(row?.quantidade ?? 0) };
    }),
  };
}

interface DailyRow {
  mes: string;
  dia: number;
  total: bigint;
}

/** Gasto acumulado dia a dia no mês de referência e no mês anterior, para comparar o ritmo. */
export async function daily(userId: string, query: PeriodQuery) {
  await assertAccountOwned(userId, query.accountId);

  const today = todayInSaoPaulo();
  const currentMonth = startOfMonth(query.dataFim ?? today);
  const previousMonth = addMonths(currentMonth, -1);

  const rows = await prisma.$queryRaw<DailyRow[]>`
    SELECT to_char(t.data, 'YYYY-MM') AS mes, EXTRACT(DAY FROM t.data)::int AS dia, SUM(t.valor) AS total
    FROM "Transaction" t
    JOIN "Account" a ON a.id = t."accountId"
    WHERE ${reportSqlFilter(userId, query.accountId, { inicio: previousMonth, fim: endOfMonth(currentMonth) })}
      AND t.tipo = 'DESPESA'
    GROUP BY 1, 2`;

  const build = (month: Date, lastDay: number) => {
    const mes = monthKey(month);
    let acumulado = 0;
    const dias = Array.from({ length: lastDay }, (_, index) => {
      const dia = index + 1;
      const total = Number(rows.find((row) => row.mes === mes && row.dia === dia)?.total ?? 0);
      acumulado += total;
      return { dia, total, acumulado };
    });
    return { mes, total: acumulado, dias };
  };

  // No mês em andamento, a linha para em hoje (o resto do mês ainda não aconteceu)
  const isCurrentMonth = monthKey(currentMonth) === monthKey(today);
  return {
    mesAtual: build(currentMonth, isCurrentMonth ? today.getUTCDate() : endOfMonth(currentMonth).getUTCDate()),
    mesAnterior: build(previousMonth, endOfMonth(previousMonth).getUTCDate()),
  };
}

export async function topMerchants(userId: string, query: TopMerchantsQuery) {
  await assertAccountOwned(userId, query.accountId);
  const period = resolvePeriod(query);

  // O banco soma por descrição exata; aqui só se juntam os grupos de descrições parecidas
  const groups = await prisma.transaction.groupBy({
    by: ["descricao"],
    where: { ...reportWhere(userId, query.accountId, period), tipo: query.tipo },
    _sum: { valor: true },
    _count: { _all: true },
  });

  const merchants = new Map<string, { nome: string; maior: number; total: number; quantidade: number }>();
  for (const group of groups) {
    const key = merchantKey(group.descricao);
    const valor = group._sum.valor ?? 0;
    const merchant = merchants.get(key) ?? { nome: "", maior: -1, total: 0, quantidade: 0 };
    merchant.total += valor;
    merchant.quantidade += group._count._all;
    // O nome exibido é o da variação que mais pesa no total
    if (valor > merchant.maior) {
      merchant.maior = valor;
      merchant.nome = merchantName(group.descricao);
    }
    merchants.set(key, merchant);
  }

  const total = groups.reduce((sum, group) => sum + (group._sum.valor ?? 0), 0);

  return {
    periodo: { dataInicio: toISODate(period.inicio), dataFim: toISODate(period.fim) },
    tipo: query.tipo,
    total,
    estabelecimentos: [...merchants.values()]
      .sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome))
      .slice(0, query.limite)
      .map(({ nome, total: valor, quantidade }) => ({
        nome,
        total: valor,
        quantidade,
        percentual: percentage(valor, total),
      })),
  };
}

export async function largestExpenses(userId: string, query: LargestExpensesQuery) {
  await assertAccountOwned(userId, query.accountId);
  const period = resolvePeriod(query);

  const transactions = await prisma.transaction.findMany({
    where: { ...reportWhere(userId, query.accountId, period), tipo: "DESPESA" },
    include: transactionInclude,
    orderBy: [{ valor: "desc" }, { data: "desc" }, { id: "asc" }],
    take: query.limite,
  });

  return transactions.map(serializeTransaction);
}

interface RecurringRow {
  descricao: string;
  mes: string;
  total: bigint;
  quantidade: bigint;
  ultima: Date;
}

/** Uma cobrança é "parecida" com as outras se fica a até 20% da mediana delas. */
const RECURRING_TOLERANCE = 0.2;
const RECURRING_MIN_MONTHS = 3;
/** Mais lançamentos que isso no mês indica um gasto frequente (mercado, transporte), não uma cobrança fixa. */
const RECURRING_MAX_PER_MONTH = 2;

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

function similar(values: number[]): boolean {
  const reference = median(values);
  return values.every((value) => Math.abs(value - reference) <= reference * RECURRING_TOLERANCE);
}

/**
 * Cobranças recorrentes: mesma descrição (normalizada), valor parecido, em pelo menos 3 meses
 * seguidos, e ainda ativas (a última cobrança foi neste mês ou no anterior).
 * Olha os últimos `meses` meses até `dataFim` (padrão: hoje), ou desde `dataInicio`.
 */
export async function recurring(userId: string, query: RecurringQuery) {
  await assertAccountOwned(userId, query.accountId);
  const period = resolveMonths(query, query.meses);
  const referenceMonth = startOfMonth(period.fim);

  const rows = await prisma.$queryRaw<RecurringRow[]>`
    SELECT t.descricao, to_char(date_trunc('month', t.data), 'YYYY-MM') AS mes,
           SUM(t.valor) AS total, COUNT(*) AS quantidade, MAX(t.data) AS ultima
    FROM "Transaction" t
    JOIN "Account" a ON a.id = t."accountId"
    WHERE ${reportSqlFilter(userId, query.accountId, period)} AND t.tipo = 'DESPESA'
    GROUP BY 1, 2`;

  // Junta as descrições parecidas, mês a mês
  interface Month {
    total: number;
    quantidade: number;
    ultima: Date;
    nome: string;
  }
  const merchants = new Map<string, Map<string, Month>>();
  for (const row of rows) {
    const key = merchantKey(row.descricao);
    const months = merchants.get(key) ?? new Map<string, Month>();
    const month = months.get(row.mes) ?? { total: 0, quantidade: 0, ultima: row.ultima, nome: merchantName(row.descricao) };
    month.total += Number(row.total);
    month.quantidade += Number(row.quantidade);
    if (row.ultima >= month.ultima) {
      month.ultima = row.ultima;
      month.nome = merchantName(row.descricao);
    }
    months.set(row.mes, month);
    merchants.set(key, months);
  }

  const recorrentes = [];
  for (const [chave, months] of merchants) {
    // Sequência de meses seguidos que termina na cobrança mais recente
    const lastKey = [...months.keys()].sort().at(-1)!;
    let cursor = new Date(`${lastKey}-01T00:00:00.000Z`);
    const lastMonth = cursor;
    const run: Month[] = [];
    while (months.has(monthKey(cursor))) {
      run.unshift(months.get(monthKey(cursor))!);
      cursor = addMonths(cursor, -1);
    }

    // Se o valor mudou no caminho (reajuste), vale a parte mais recente com valores parecidos
    let streak = run;
    while (streak.length >= RECURRING_MIN_MONTHS && !similar(streak.map((month) => month.total))) {
      streak = streak.slice(1);
    }

    const active = lastMonth >= addMonths(referenceMonth, -1);
    const fixedCharge = streak.every((month) => month.quantidade <= RECURRING_MAX_PER_MONTH);
    if (streak.length < RECURRING_MIN_MONTHS || !active || !fixedCharge) continue;

    const last = streak.at(-1)!;
    const valorMedio = Math.round(streak.reduce((sum, month) => sum + month.total, 0) / streak.length);
    recorrentes.push({
      /** Descrição normalizada, que identifica o estabelecimento (veja lib/merchant.ts). */
      chave,
      nome: last.nome,
      valorMedio,
      ultimoValor: last.total,
      ultimaCobranca: toISODate(last.ultima),
      mesesSeguidos: streak.length,
      custoAnual: valorMedio * 12,
    });
  }

  recorrentes.sort((a, b) => b.valorMedio - a.valorMedio || a.nome.localeCompare(b.nome));
  const totalMensal = recorrentes.reduce((sum, item) => sum + item.valorMedio, 0);

  return {
    periodo: { dataInicio: toISODate(period.inicio), dataFim: toISODate(period.fim) },
    totalMensal,
    totalAnual: totalMensal * 12,
    recorrentes,
  };
}

/** Valor em centavos como texto com vírgula decimal ("-1234,56"), sem passar por ponto flutuante. */
function csvAmount(centavos: number, tipo: TransactionType): string {
  const reais = Math.trunc(centavos / 100);
  const resto = String(centavos % 100).padStart(2, "0");
  return `${tipo === "DESPESA" ? "-" : ""}${reais},${resto}`;
}

function csvCell(value: string): string {
  // Texto que começa com = + - @ seria interpretado como fórmula pelo Excel
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[";\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

/**
 * Transações do período em CSV para abrir no Excel: separador ";", vírgula decimal e
 * UTF-8 com BOM (é o BOM que faz o Excel ler os acentos corretamente).
 * Aqui entram todas as transações, com uma coluna dizendo quais ficam fora dos relatórios.
 */
export async function exportCsv(userId: string, query: PeriodQuery) {
  await assertAccountOwned(userId, query.accountId);
  const period = resolvePeriod(query);

  const transactions = await prisma.transaction.findMany({
    where: { ...reportWhere(userId, query.accountId, period), ignorarNosRelatorios: undefined },
    include: transactionInclude,
    orderBy: [{ data: "asc" }, { createdAt: "asc" }, { id: "asc" }],
  });

  const lines = [
    ["Data", "Descrição", "Categoria", "Conta", "Tipo", "Valor", "Fora dos relatórios"].join(";"),
    ...transactions.map((transaction) => {
      const [ano, mes, dia] = toISODate(transaction.data).split("-");
      return [
        `${dia}/${mes}/${ano}`,
        csvCell(transaction.descricao),
        csvCell(transaction.category?.nome ?? ""),
        csvCell(transaction.account.nome),
        transaction.tipo === "DESPESA" ? "Despesa" : "Receita",
        csvAmount(transaction.valor, transaction.tipo),
        transaction.ignorarNosRelatorios ? "Sim" : "Não",
      ].join(";");
    }),
  ];

  return {
    filename: `transacoes_${toISODate(period.inicio)}_a_${toISODate(period.fim)}.csv`,
    content: `﻿${lines.join("\r\n")}\r\n`,
  };
}
