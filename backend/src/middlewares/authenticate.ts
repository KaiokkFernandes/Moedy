import type { RequestHandler } from "express";
import { verifyToken } from "../lib/jwt.js";
import { AppError } from "./errorHandler.js";

declare global {
  namespace Express {
    interface Request {
      /** Definido pelo middleware `authenticate`; só existe em rotas protegidas. */
      userId: string;
    }
  }
}

export const authenticate: RequestHandler = (req, _res, next) => {
  const [scheme, token] = req.headers.authorization?.split(" ") ?? [];
  if (scheme !== "Bearer" || !token) {
    throw new AppError("Não autenticado", 401);
  }

  try {
    req.userId = verifyToken(token);
  } catch {
    throw new AppError("Sessão inválida ou expirada", 401);
  }

  next();
};
