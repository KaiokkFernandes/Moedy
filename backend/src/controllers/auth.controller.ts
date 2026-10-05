import type { RequestHandler } from "express";
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
