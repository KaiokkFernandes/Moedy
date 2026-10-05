import "dotenv/config";
import bcrypt from "bcryptjs";
import type { AccountType } from "../src/generated/prisma/client.js";
import { DEFAULT_CATEGORIES } from "../src/lib/defaultCategories.js";
import { prisma } from "../src/lib/prisma.js";
import { registerSchema } from "../src/schemas/auth.schema.js";
import { createUserWithDefaults } from "../src/services/auth.service.js";
import { buildSeedTransactions } from "./seedTransactions.js";

// As credenciais do usuário de teste vêm do .env (veja o .env.example).
const parsed = registerSchema.safeParse({
  nome: process.env.SEED_USER_NOME,
  email: process.env.SEED_USER_EMAIL,
  senha: process.env.SEED_USER_SENHA,
});

if (!parsed.success) {
  console.error("Defina SEED_USER_NOME, SEED_USER_EMAIL e SEED_USER_SENHA no backend/.env:");
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

const input = parsed.data;
let user = await prisma.user.findUnique({ where: { email: input.email } });

if (!user) {
  user = await createUserWithDefaults(input);
  console.log(`✅ Usuário de teste criado: ${input.email}`);
} else {
  // Rodar o seed de novo redefine nome/senha e repõe categorias padrão que faltarem.
  await prisma.user.update({
    where: { id: user.id },
    data: { nome: input.nome, senha: await bcrypt.hash(input.senha, 10) },
  });
  for (const category of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { userId_nome_tipo: { userId: user.id, nome: category.nome, tipo: category.tipo } },
      update: {},
      create: { ...category, userId: user.id },
    });
  }
  console.log(`✅ Usuário de teste atualizado: ${input.email}`);
}

const userId = user.id;

// Contas de exemplo, identificadas pelo externalId para não duplicar ao rodar o seed de novo.
async function ensureAccount(externalId: string, nome: string, tipo: AccountType, saldoInicial: number) {
  const existing = await prisma.account.findFirst({ where: { userId, externalId } });
  return existing ?? prisma.account.create({ data: { userId, externalId, nome, tipo, saldoInicial } });
}

const contas = {
  corrente: await ensureAccount("seed-corrente", "Conta Corrente", "CORRENTE", 350000),
  cartao: await ensureAccount("seed-cartao", "Cartão de Crédito", "CARTAO", 0),
};

const categories = await prisma.category.findMany({ where: { userId } });
const categoryId = (nome: string | null, tipo: string) =>
  nome ? (categories.find((category) => category.nome === nome && category.tipo === tipo)?.id ?? null) : null;

// O índice único (accountId, externalId) faz o skipDuplicates ignorar o que já foi criado antes.
const { count } = await prisma.transaction.createMany({
  skipDuplicates: true,
  data: buildSeedTransactions().map(({ conta, categoria, ...transaction }) => ({
    ...transaction,
    accountId: contas[conta].id,
    categoryId: categoryId(categoria, transaction.tipo),
  })),
});

console.log(`✅ Contas de exemplo prontas; ${count} transações novas criadas`);

await prisma.$disconnect();
