import type { Prisma } from "../generated/prisma/client.js";
import { createRuleMatcher } from "../lib/categoryRules.js";
import { DEFAULT_RULES } from "../lib/defaultRules.js";
import { prisma } from "../lib/prisma.js";
import { normalizeText } from "../lib/text.js";
import { AppError } from "../middlewares/errorHandler.js";
import type { CategoryRuleInput } from "../schemas/categoryRule.schema.js";

const include = {
  category: { select: { id: true, nome: true, cor: true, icone: true, tipo: true } },
} satisfies Prisma.CategoryRuleInclude;

async function findOwned(userId: string, id: string) {
  const rule = await prisma.categoryRule.findFirst({ where: { id, userId } });
  if (!rule) {
    throw new AppError("Regra não encontrada", 404);
  }
  return rule;
}

/** A categoria precisa ser do usuário, e a palavra-chave não pode repetir (ignorando acentos e maiúsculas). */
async function assertValid(userId: string, { palavraChave, categoryId }: CategoryRuleInput, ignoreId?: string) {
  const category = await prisma.category.findFirst({ where: { id: categoryId, userId } });
  if (!category) {
    throw new AppError("Categoria não encontrada", 404);
  }

  const keyword = normalizeText(palavraChave);
  const rules = await prisma.categoryRule.findMany({ where: { userId, id: { not: ignoreId } } });
  if (rules.some((rule) => normalizeText(rule.palavraChave) === keyword)) {
    throw new AppError("Já existe uma regra com essa palavra-chave", 409);
  }
}

export async function list(userId: string) {
  return prisma.categoryRule.findMany({ where: { userId }, include, orderBy: { palavraChave: "asc" } });
}

export async function create(userId: string, input: CategoryRuleInput) {
  await assertValid(userId, input);
  return prisma.categoryRule.create({ data: { ...input, userId }, include });
}

export async function update(userId: string, id: string, input: CategoryRuleInput) {
  await findOwned(userId, id);
  await assertValid(userId, input, id);
  return prisma.categoryRule.update({ where: { id }, data: input, include });
}

export async function remove(userId: string, id: string) {
  await findOwned(userId, id);
  await prisma.categoryRule.delete({ where: { id } });
}

/** Função que sugere a categoria de uma transação pelas regras do usuário. */
export async function getMatcher(userId: string) {
  return createRuleMatcher(await prisma.categoryRule.findMany({ where: { userId }, include }));
}

/** Aplica as regras às transações do usuário que estão sem categoria. */
export async function applyToUncategorized(userId: string) {
  const match = await getMatcher(userId);
  const transactions = await prisma.transaction.findMany({
    where: { categoryId: null, account: { userId } },
    select: { id: true, descricao: true, tipo: true },
  });

  // Agrupa por categoria para fazer uma atualização por categoria, e não uma por transação
  const idsByCategory = new Map<string, string[]>();
  for (const transaction of transactions) {
    const categoryId = match(transaction.descricao, transaction.tipo);
    if (!categoryId) continue;
    idsByCategory.set(categoryId, [...(idsByCategory.get(categoryId) ?? []), transaction.id]);
  }

  const results = await prisma.$transaction(
    [...idsByCategory].map(([categoryId, ids]) =>
      // Repete o filtro "sem categoria" para não sobrescrever algo categorizado nesse meio-tempo
      prisma.transaction.updateMany({
        where: { id: { in: ids }, categoryId: null },
        data: { categoryId, origemCategoria: "REGRA" },
      }),
    ),
  );

  const categorizadas = results.reduce((total, result) => total + result.count, 0);
  return { categorizadas, semCategoria: transactions.length - categorizadas };
}

/**
 * Cria as regras padrão que o usuário ainda não tem (pela palavra-chave), ligando cada uma
 * à categoria padrão de mesmo nome. Usado no cadastro e no seed.
 */
export async function ensureDefaultRules(userId: string, db: Prisma.TransactionClient = prisma) {
  const [categories, existing] = await Promise.all([
    db.category.findMany({ where: { userId } }),
    db.categoryRule.findMany({ where: { userId } }),
  ]);
  const existingKeywords = new Set(existing.map((rule) => normalizeText(rule.palavraChave)));

  const data = DEFAULT_RULES.flatMap(({ palavraChave, categoria, tipo }) => {
    const category = categories.find((item) => item.nome === categoria && item.tipo === tipo);
    if (!category || existingKeywords.has(normalizeText(palavraChave))) return [];
    return [{ userId, palavraChave, categoryId: category.id }];
  });

  const { count } = await db.categoryRule.createMany({ data });
  return count;
}
