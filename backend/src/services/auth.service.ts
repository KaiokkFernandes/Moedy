import bcrypt from "bcryptjs";
import type { User } from "../generated/prisma/client.js";
import { DEFAULT_CATEGORIES } from "../lib/defaultCategories.js";
import type { PerfilGoogle } from "../lib/google.js";
import { signToken } from "../lib/jwt.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middlewares/errorHandler.js";
import type { LoginInput, RegisterInput } from "../schemas/auth.schema.js";
import { ensureDefaultRules } from "./categoryRule.service.js";

const SALT_ROUNDS = 10;

export type PublicUser = Omit<User, "senha" | "googleId">;

function toPublicUser({ senha: _senha, googleId: _googleId, ...user }: User): PublicUser {
  return user;
}

function sessao(user: User) {
  return { token: signToken(user.id), user: toPublicUser(user) };
}

const ehEmailDuplicado = (err: unknown) => (err as { code?: string }).code === "P2002";

interface NovoUsuario {
  nome: string;
  email: string;
  /** Ausente nas contas criadas pelo login com Google. */
  senha?: string;
  googleId?: string;
}

/**
 * Cria o usuário já com as categorias e as regras de categorização padrão. Usado pelo cadastro,
 * pelo login com Google e pelo seed.
 */
export async function createUserWithDefaults({ nome, email, senha, googleId }: NovoUsuario): Promise<User> {
  const hash = senha ? await bcrypt.hash(senha, SALT_ROUNDS) : null;

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { nome, email, senha: hash, googleId, categories: { create: DEFAULT_CATEGORIES } },
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
    if (ehEmailDuplicado(err)) {
      throw new AppError("Email já cadastrado", 409);
    }
    throw err;
  }

  return sessao(user);
}

export async function login({ email, senha }: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email } });
  // Conta criada pelo Google não tem senha: a mesma mensagem, para não revelar como ela entra
  if (!user?.senha || !(await bcrypt.compare(senha, user.senha))) {
    throw new AppError("Email ou senha incorretos", 401);
  }

  return sessao(user);
}

/**
 * Login com Google, com o perfil já verificado:
 * 1. conta já ligada a este Google → entra;
 * 2. conta com o mesmo email (cadastrada com senha) → liga o Google a ela e entra; as duas formas
 *    passam a valer. É seguro porque o Google confirmou que o email é do usuário;
 * 3. nenhuma conta → cria uma, sem senha, se o cadastro estiver aberto.
 */
export async function loginWithGoogle(perfil: PerfilGoogle, { cadastroAberto }: { cadastroAberto: boolean }) {
  const porGoogle = await prisma.user.findUnique({ where: { googleId: perfil.googleId } });
  if (porGoogle) return sessao(porGoogle);

  const porEmail = await prisma.user.findUnique({ where: { email: perfil.email } });
  if (porEmail) {
    if (porEmail.googleId) {
      // O email já está ligado a outra conta Google (ex.: o usuário trocou o email no Google)
      throw new AppError("Este email já está ligado a outra conta Google.", 409);
    }
    return sessao(await prisma.user.update({ where: { id: porEmail.id }, data: { googleId: perfil.googleId } }));
  }

  if (!cadastroAberto) {
    throw new AppError("O cadastro de novos usuários está desativado", 403);
  }

  try {
    return sessao(await createUserWithDefaults(perfil));
  } catch (err) {
    // Dois logins simultâneos do mesmo usuário novo: o segundo encontra a conta criada pelo primeiro
    if (ehEmailDuplicado(err)) {
      const criada = await prisma.user.findUnique({ where: { googleId: perfil.googleId } });
      if (criada) return sessao(criada);
    }
    throw err;
  }
}

export async function getUserById(id: string): Promise<PublicUser> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError("Não autenticado", 401);
  }
  return toPublicUser(user);
}
