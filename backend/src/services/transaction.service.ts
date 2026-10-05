import type { Prisma, TransactionType } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middlewares/errorHandler.js";
import type { ListTransactionsQuery, TransactionInput } from "../schemas/transaction.schema.js";

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

function buildWhere(userId: string, query: ListTransactionsQuery): Prisma.TransactionWhereInput {
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

  return serializeTransaction(await prisma.transaction.create({ data: input, include }));
}

export async function update(userId: string, id: string, input: TransactionInput) {
  await findOwned(userId, id);
  await assertAccountOwned(userId, input.accountId);
  await assertCategoryMatches(userId, input.categoryId, input.tipo);

  return serializeTransaction(await prisma.transaction.update({ where: { id }, data: input, include }));
}

export async function updateCategory(userId: string, id: string, categoryId: string | null) {
  const transaction = await findOwned(userId, id);
  await assertCategoryMatches(userId, categoryId, transaction.tipo);

  return serializeTransaction(await prisma.transaction.update({ where: { id }, data: { categoryId }, include }));
}

export async function remove(userId: string, id: string) {
  await findOwned(userId, id);
  await prisma.transaction.delete({ where: { id } });
}
