import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const JWT_EXPIRES_IN = "7d";

export function signToken(userId: string): string {
  return jwt.sign({}, env.JWT_SECRET, { subject: userId, expiresIn: JWT_EXPIRES_IN });
}

/** Retorna o userId do token ou lança erro se ele for inválido/expirado. */
export function verifyToken(token: string): string {
  const payload = jwt.verify(token, env.JWT_SECRET);
  if (typeof payload === "string" || !payload.sub) {
    throw new Error("Token sem usuário");
  }
  return payload.sub;
}
