import type { RequestHandler } from "express";
import { env } from "../config/env.js";
import { AppError } from "../middlewares/errorHandler.js";
import { criarVerificadorGoogle, type VerificadorGoogle } from "../lib/google.js";
import { googleLoginSchema, loginSchema, registerSchema } from "../schemas/auth.schema.js";
import * as authService from "../services/auth.service.js";

export const register: RequestHandler = async (req, res) => {
  const input = registerSchema.parse(req.body);
  res.status(201).json(await authService.register(input));
};

export const login: RequestHandler = async (req, res) => {
  const input = loginSchema.parse(req.body);
  res.json(await authService.login(input));
};

let verificarGoogle: VerificadorGoogle | undefined;

export const google: RequestHandler = async (req, res) => {
  if (!env.GOOGLE_CLIENT_ID) {
    throw new AppError("O login com Google não está configurado", 404);
  }
  const { credential } = googleLoginSchema.parse(req.body);
  verificarGoogle ??= criarVerificadorGoogle(env.GOOGLE_CLIENT_ID);
  const perfil = await verificarGoogle(credential);
  res.json(await authService.loginWithGoogle(perfil, { cadastroAberto: env.REGISTRATION_ENABLED }));
};

export const me: RequestHandler = async (req, res) => {
  res.json({ user: await authService.getUserById(req.userId) });
};

export const config: RequestHandler = (_req, res) => {
  // O Client ID do Google é público (vai no botão do navegador de qualquer forma)
  res.json({ registrationEnabled: env.REGISTRATION_ENABLED, googleClientId: env.GOOGLE_CLIENT_ID ?? null });
};

/** Com REGISTRATION_ENABLED=false, ninguém novo se cadastra (as contas existentes seguem normais). */
export const requireRegistrationEnabled: RequestHandler = (_req, _res, next) => {
  if (!env.REGISTRATION_ENABLED) {
    throw new AppError("O cadastro de novos usuários está desativado", 403);
  }
  next();
};
