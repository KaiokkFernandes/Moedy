import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const JWT_EXPIRES_IN = "7d";
/** Um único algoritmo, na assinatura e na verificação: um token com outro algoritmo é recusado. */
const JWT_ALGORITHM = "HS256";

export function signToken(userId: string): string {
  return jwt.sign({}, env.JWT_SECRET, { subject: userId, expiresIn: JWT_EXPIRES_IN, algorithm: JWT_ALGORITHM });
}

/** Retorna o userId do token ou lança erro se ele for inválido/expirado. */
export function verifyToken(token: string): string {
  const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: [JWT_ALGORITHM] });
  if (typeof payload === "string" || !payload.sub) {
    throw new Error("Token sem usuário");
  }
  return payload.sub;
}
