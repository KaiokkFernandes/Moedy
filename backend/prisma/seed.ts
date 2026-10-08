import "./seedGuard.js";
import "dotenv/config";
import bcrypt from "bcryptjs";
import type { AccountType } from "../src/generated/prisma/client.js";
import { DEFAULT_CATEGORIES } from "../src/lib/defaultCategories.js";
import { endOfMonth, startOfMonth, todayInSaoPaulo } from "../src/lib/dates.js";
import { prisma } from "../src/lib/prisma.js";
import { registerSchema } from "../src/schemas/auth.schema.js";
import { checkAlerts } from "../src/services/alert.service.js";
import { createUserWithDefaults } from "../src/services/auth.service.js";
import { ensureDefaultRules } from "../src/services/categoryRule.service.js";
import { totalsByCategory } from "../src/services/report.service.js";
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

// Repõe as regras de categorização padrão que faltarem (as já existentes não são alteradas).
const novasRegras = await ensureDefaultRules(userId);
if (novasRegras > 0) console.log(`✅ ${novasRegras} regras de categorização padrão criadas`);

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

// Orçamentos do mês atual, com pelo menos um em cada situação. Os limites saem do gasto real do
// mês até hoje, para as situações valerem em qualquer dia em que o seed rode. Orçamentos que já
// existem não são alterados.
const hoje = todayInSaoPaulo();
const mesAtual = { mes: hoje.getUTCMonth() + 1, ano: hoje.getUTCFullYear() };
const gastos = await totalsByCategory(userId, { inicio: startOfMonth(hoje), fim: endOfMonth(hoje) });

const limites: [categoria: string, limite: (gasto: number) => number][] = [
  // Estourado: limite 10% abaixo do que já foi gasto
  ["Transporte", (gasto) => (gasto > 0 ? Math.max(1000, Math.floor((gasto * 0.9) / 1000) * 1000) : 60000)],
  // Atenção: o gasto fica em cerca de 88% do limite
  ["Mercado", (gasto) => (gasto > 0 ? Math.round(gasto / 0.88) : 120000)],
  // Dentro do limite, com folga
  ["Alimentação", (gasto) => Math.max(80000, Math.ceil((gasto * 2.5) / 1000) * 1000)],
  ["Lazer", (gasto) => Math.max(60000, Math.ceil((gasto * 2) / 1000) * 1000)],
  ["Moradia", () => 250000],
];

const { count: novosOrcamentos } = await prisma.budget.createMany({
  skipDuplicates: true,
  data: limites.flatMap(([nome, limite]) => {
    const categoria = categories.find((category) => category.nome === nome && category.tipo === "DESPESA");
    if (!categoria) return [];
    const gasto = gastos.find((group) => group.categoryId === categoria.id)?._sum.valor ?? 0;
    return [{ userId, categoryId: categoria.id, valorLimite: limite(gasto), ...mesAtual }];
  }),
});

// Gera os alertas dos orçamentos (cada um é criado uma única vez, mesmo rodando o seed de novo)
const novosAlertas = await checkAlerts(userId);
console.log(`✅ ${novosOrcamentos} orçamentos e ${novosAlertas} alertas novos criados`);

await prisma.$disconnect();
