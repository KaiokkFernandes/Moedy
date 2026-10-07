import type { RequestHandler } from "express";
import { env } from "../config/env.js";
import { AppError } from "../middlewares/errorHandler.js";
import { loginSchema, registerSchema } from "../schemas/auth.schema.js";
import * as authService from "../services/auth.service.js";

export const register: RequestHandler = async (req, res) => {
  const input = registerSchema.parse(req.body);
  res.status(201).json(await authService.register(input));
};

export const login: RequestHandler = async (req, res) => {
  const input = loginSchema.parse(req.body);
  res.json(await authService.login(input));
};

export const me: RequestHandler = async (req, res) => {
  res.json({ user: await authService.getUserById(req.userId) });
};

export const config: RequestHandler = (_req, res) => {
  res.json({ registrationEnabled: env.REGISTRATION_ENABLED });
};

/** Com REGISTRATION_ENABLED=false, ninguém novo se cadastra (as contas existentes seguem normais). */
export const requireRegistrationEnabled: RequestHandler = (_req, _res, next) => {
  if (!env.REGISTRATION_ENABLED) {
    throw new AppError("O cadastro de novos usuários está desativado", 403);
  }
  next();
};
