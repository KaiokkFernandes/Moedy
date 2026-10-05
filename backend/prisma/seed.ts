import "dotenv/config";
import bcrypt from "bcryptjs";
import { DEFAULT_CATEGORIES } from "../src/lib/defaultCategories.js";
import { prisma } from "../src/lib/prisma.js";
import { registerSchema } from "../src/schemas/auth.schema.js";
import { createUserWithDefaults } from "../src/services/auth.service.js";

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
const existing = await prisma.user.findUnique({ where: { email: input.email } });

if (!existing) {
  await createUserWithDefaults(input);
  console.log(`✅ Usuário de teste criado: ${input.email}`);
} else {
  // Rodar o seed de novo redefine nome/senha e repõe categorias padrão que faltarem.
  await prisma.user.update({
    where: { id: existing.id },
    data: { nome: input.nome, senha: await bcrypt.hash(input.senha, 10) },
  });
  for (const category of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { userId_nome_tipo: { userId: existing.id, nome: category.nome, tipo: category.tipo } },
      update: {},
      create: { ...category, userId: existing.id },
    });
  }
  console.log(`✅ Usuário de teste atualizado: ${input.email}`);
}

await prisma.$disconnect();
