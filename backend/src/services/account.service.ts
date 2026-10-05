import type { Account } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middlewares/errorHandler.js";
import type { AccountInput } from "../schemas/account.schema.js";

/** Acrescenta o saldo atual (saldoInicial + receitas − despesas) e o nº de transações. */
async function withBalance(accounts: Account[]) {
  const groups = await prisma.transaction.groupBy({
    by: ["accountId", "tipo"],
    where: { accountId: { in: accounts.map((account) => account.id) } },
    _sum: { valor: true },
    _count: { _all: true },
  });

  return accounts.map((account) => {
    let saldoAtual = account.saldoInicial;
    let totalTransacoes = 0;
    for (const group of groups) {
      if (group.accountId !== account.id) continue;
      const soma = group._sum.valor ?? 0;
      saldoAtual += group.tipo === "RECEITA" ? soma : -soma;
      totalTransacoes += group._count._all;
    }
    return { ...account, saldoAtual, totalTransacoes };
  });
}

async function findOwned(userId: string, id: string) {
  const account = await prisma.account.findFirst({ where: { id, userId } });
  if (!account) {
    throw new AppError("Conta não encontrada", 404);
  }
  return account;
}

export async function list(userId: string) {
  const accounts = await prisma.account.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
  return withBalance(accounts);
}

export async function create(userId: string, input: AccountInput) {
  const account = await prisma.account.create({ data: { ...input, userId } });
  return (await withBalance([account]))[0];
}

export async function update(userId: string, id: string, input: AccountInput) {
  await findOwned(userId, id);
  const account = await prisma.account.update({ where: { id }, data: input });
  return (await withBalance([account]))[0];
}

export async function remove(userId: string, id: string, confirmed: boolean) {
  await findOwned(userId, id);

  const transacoes = await prisma.transaction.count({ where: { accountId: id } });
  if (transacoes > 0 && !confirmed) {
    throw new AppError(
      `Esta conta tem ${transacoes} ${transacoes === 1 ? "transação" : "transações"}. ` +
        "Para excluir a conta e as transações dela, confirme com ?confirm=true",
      409,
      { transacoes },
    );
  }

  // As transações são apagadas junto (onDelete: Cascade)
  await prisma.account.delete({ where: { id } });
}
