import bcrypt from "bcryptjs";
import type { User } from "../generated/prisma/client.js";
import { DEFAULT_CATEGORIES } from "../lib/defaultCategories.js";
import { signToken } from "../lib/jwt.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middlewares/errorHandler.js";
import type { LoginInput, RegisterInput } from "../schemas/auth.schema.js";
import { ensureDefaultRules } from "./categoryRule.service.js";

const SALT_ROUNDS = 10;

export type PublicUser = Omit<User, "senha">;

function toPublicUser({ senha: _senha, ...user }: User): PublicUser {
  return user;
}

/** Cria o usuário já com as categorias e as regras de categorização padrão. Usado pelo cadastro e pelo seed. */
export async function createUserWithDefaults({ nome, email, senha }: RegisterInput): Promise<User> {
  const hash = await bcrypt.hash(senha, SALT_ROUNDS);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { nome, email, senha: hash, categories: { create: DEFAULT_CATEGORIES } },
    });
    await ensureDefaultRules(user.id, tx);
    return user;
  });
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AppError("Email já cadastrado", 409);
  }

  let user: User;
  try {
    user = await createUserWithDefaults(input);
  } catch (err) {
    // Dois cadastros simultâneos com o mesmo email: o índice único do banco barra o segundo
    if ((err as { code?: string }).code === "P2002") {
      throw new AppError("Email já cadastrado", 409);
    }
    throw err;
  }

  return { token: signToken(user.id), user: toPublicUser(user) };
}

export async function login({ email, senha }: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(senha, user.senha))) {
    throw new AppError("Email ou senha incorretos", 401);
  }

  return { token: signToken(user.id), user: toPublicUser(user) };
}

export async function getUserById(id: string): Promise<PublicUser> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError("Não autenticado", 401);
  }
  return toPublicUser(user);
}
