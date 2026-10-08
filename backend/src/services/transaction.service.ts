import type { Prisma, TransactionType } from "../generated/prisma/client.js";
import { logger } from "../lib/logger.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middlewares/errorHandler.js";
import { aiConfig } from "./ai/index.js";
import { suggestCategories } from "./categorization.service.js";
import { remember } from "./categoryMemory.service.js";
import type { ListTransactionsQuery, SuggestCategoriesQuery, TransactionInput } from "../schemas/transaction.schema.js";

export const transactionInclude = {
  category: { select: { id: true, nome: true, cor: true, icone: true } },
  account: { select: { id: true, nome: true } },
} satisfies Prisma.TransactionInclude;

const include = transactionInclude;

type TransactionWithRelations = Prisma.TransactionGetPayload<{ include: typeof include }>;

/** A data é só o dia (sem hora), então vai para a API como AAAA-MM-DD. */
export function serializeTransaction(transaction: TransactionWithRelations) {
  return { ...transaction, data: transaction.data.toISOString().slice(0, 10) };
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function buildWhere(userId: string, query: ListTransactionsQuery): Prisma.TransactionWhereInput {
  const { dataInicio, dataFim, accountId, categoryId, tipo, busca, semCategoria } = query;

  return {
    account: { userId },
    accountId,
    categoryId: semCategoria ? null : categoryId,
    tipo,
    descricao: busca ? { contains: busca, mode: "insensitive" } : undefined,
    data: {
      gte: dataInicio,
      // dataFim é inclusiva: tudo antes do dia seguinte
      lt: dataFim ? new Date(dataFim.getTime() + DAY_MS) : undefined,
    },
  };
}

export async function list(userId: string, query: ListTransactionsQuery) {
  const where = buildWhere(userId, query);
  const { page, pageSize } = query;

  const [itens, total, totais] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include,
      orderBy: [{ data: "desc" }, { createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.transaction.count({ where }),
    // Os totais seguem a mesma regra dos relatórios: transferências e pagamentos de fatura não contam
    prisma.transaction.groupBy({
      by: ["tipo"],
      where: { ...where, ignorarNosRelatorios: false },
      _sum: { valor: true },
    }),
  ]);

  const soma = (tipo: TransactionType) => totais.find((group) => group.tipo === tipo)?._sum.valor ?? 0;

  return {
    itens: itens.map(serializeTransaction),
    total,
    page,
    pageSize,
    totalReceitas: soma("RECEITA"),
    totalDespesas: soma("DESPESA"),
  };
}

async function findOwned(userId: string, id: string) {
  const transaction = await prisma.transaction.findFirst({ where: { id, account: { userId } } });
  if (!transaction) {
    throw new AppError("Transação não encontrada", 404);
  }
  return transaction;
}

async function assertAccountOwned(userId: string, accountId: string) {
  const account = await prisma.account.findFirst({ where: { id: accountId, userId } });
  if (!account) {
    throw new AppError("Conta não encontrada", 404);
  }
}

/** A categoria (quando informada) precisa ser do usuário e do mesmo tipo da transação. */
async function assertCategoryMatches(userId: string, categoryId: string | null, tipo: TransactionType) {
  if (!categoryId) return;

  const category = await prisma.category.findFirst({ where: { id: categoryId, userId } });
  if (!category) {
    throw new AppError("Categoria não encontrada", 404);
  }
  if (category.tipo !== tipo) {
    const nome = (t: TransactionType) => (t === "DESPESA" ? "despesa" : "receita");
    throw new AppError(
      `A categoria "${category.nome}" é de ${nome(category.tipo)} e não pode ser usada em uma ${nome(tipo)}`,
      400,
    );
  }
}

export async function create(userId: string, input: TransactionInput) {
  await assertAccountOwned(userId, input.accountId);
  await assertCategoryMatches(userId, input.categoryId, input.tipo);

  return serializeTransaction(await prisma.transaction.create({ data: { ...input, origemCategoria: "MANUAL" }, include }));
}

export async function update(userId: string, id: string, input: TransactionInput) {
  await findOwned(userId, id);
  await assertAccountOwned(userId, input.accountId);
  await assertCategoryMatches(userId, input.categoryId, input.tipo);

  const updated = await prisma.transaction.update({ where: { id }, data: { ...input, origemCategoria: "MANUAL" }, include });
  await rememberCategory(userId, updated);
  return serializeTransaction(updated);
}

export async function updateCategory(
  userId: string,
  id: string,
  categoryId: string | null,
  origem: "MANUAL" | "REGRA" | "MEMORIA" | "IA" = "MANUAL",
) {
  const transaction = await findOwned(userId, id);
  await assertCategoryMatches(userId, categoryId, transaction.tipo);

  const updated = await prisma.transaction.update({
    where: { id },
    data: { categoryId, origemCategoria: origem },
    include,
  });
  await rememberCategory(userId, updated);
  return serializeTransaction(updated);
}

/** A escolha do usuário vira memória para as próximas importações. Falha aqui não desfaz a edição. */
async function rememberCategory(
  userId: string,
  transaction: { descricao: string; tipo: TransactionType; categoryId: string | null },
) {
  if (!transaction.categoryId) return;
  try {
    await remember(userId, [{ descricao: transaction.descricao, tipo: transaction.tipo, categoryId: transaction.categoryId }]);
  } catch (error) {
    logger.warn({ erro: error instanceof Error ? error.name : "desconhecido" }, "Memória de categorias: não foi possível gravar a escolha");
  }
}

/**
 * Sugestões de categoria para as transações sem categoria que cabem no filtro. Não grava nada:
 * a tela de revisão decide o que aplicar. Exige a preferência de IA ligada.
 */
export async function suggestForUncategorized(userId: string, query: SuggestCategoriesQuery) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { usarIaImportacao: true } });
  if (!user?.usarIaImportacao) {
    throw new AppError("Ative a IA em Configurações para sugerir categorias", 409);
  }

  const where = buildWhere(userId, { ...query, categoryId: undefined, semCategoria: true, page: 1, pageSize: 1 });
  const [rows, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      select: { id: true, descricao: true, valor: true, tipo: true, data: true },
      orderBy: [{ data: "desc" }, { id: "asc" }],
      take: aiConfig().maxTransacoes,
    }),
    prisma.transaction.count({ where }),
  ]);

  const result = await suggestCategories(
    userId,
    rows.map((row, indice) => ({ indice, descricao: row.descricao, valor: row.valor, tipo: row.tipo })),
    { usarIa: true },
  );

  const itens = rows.flatMap((row, indice) => {
    const sugestao = result.sugestoes.get(indice);
    if (!sugestao) return [];
    return [
      {
        transactionId: row.id,
        descricao: row.descricao,
        valor: row.valor,
        tipo: row.tipo,
        data: row.data.toISOString().slice(0, 10),
        categoryId: sugestao.categoryId,
        origem: sugestao.origem,
        confianca: sugestao.confianca,
      },
    ];
  });

  return {
    itens,
    semSugestao: rows.length - itens.length,
    total,
    /** Quantas sem categoria ficaram de fora por causa do limite por pedido. */
    naoAnalisadas: total - rows.length,
    ia: result.ia,
  };
}

export async function remove(userId: string, id: string) {
  await findOwned(userId, id);
  await prisma.transaction.delete({ where: { id } });
}
