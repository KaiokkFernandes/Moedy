import { prisma } from "../lib/prisma.js";
import { AppError } from "../middlewares/errorHandler.js";
import type { CategoryInput } from "../schemas/category.schema.js";
import type { TransactionType } from "../generated/prisma/client.js";

async function findOwned(userId: string, id: string) {
  const category = await prisma.category.findFirst({ where: { id, userId } });
  if (!category) {
    throw new AppError("Categoria não encontrada", 404);
  }
  return category;
}

/** Mesmo nome e tipo não podem se repetir para o usuário (ignorando maiúsculas/minúsculas). */
async function assertUniqueName(userId: string, { nome, tipo }: CategoryInput, ignoreId?: string) {
  const duplicate = await prisma.category.findFirst({
    where: { userId, tipo, nome: { equals: nome, mode: "insensitive" }, id: { not: ignoreId } },
  });
  if (duplicate) {
    throw new AppError(
      `Já existe uma categoria de ${tipo === "DESPESA" ? "despesa" : "receita"} com esse nome`,
      409,
    );
  }
}

export async function list(userId: string, tipo?: TransactionType) {
  return prisma.category.findMany({
    where: { userId, tipo },
    orderBy: [{ tipo: "asc" }, { nome: "asc" }],
  });
}

export async function create(userId: string, input: CategoryInput) {
  await assertUniqueName(userId, input);
  return prisma.category.create({ data: { ...input, userId } });
}

export async function update(userId: string, id: string, input: CategoryInput) {
  const category = await findOwned(userId, id);
  await assertUniqueName(userId, input, id);

  if (input.tipo !== category.tipo) {
    // Trocar o tipo deixaria as transações com uma categoria de tipo diferente do delas
    const transacoes = await prisma.transaction.count({ where: { categoryId: id } });
    if (transacoes > 0) {
      throw new AppError("Não é possível mudar o tipo de uma categoria que já tem transações", 409);
    }
  }

  return prisma.category.update({ where: { id }, data: input });
}

export async function remove(userId: string, id: string) {
  await findOwned(userId, id);
  // As transações da categoria ficam sem categoria (onDelete: SetNull)
  await prisma.category.delete({ where: { id } });
}
