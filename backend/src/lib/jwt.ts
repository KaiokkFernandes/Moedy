import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "7d";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET não definido no .env");
}

export function signToken(userId: string): string {
  return jwt.sign({}, JWT_SECRET!, { subject: userId, expiresIn: JWT_EXPIRES_IN });
}

/** Retorna o userId do token ou lança erro se ele for inválido/expirado. */
export function verifyToken(token: string): string {
  const payload = jwt.verify(token, JWT_SECRET!);
  if (typeof payload === "string" || !payload.sub) {
    throw new Error("Token sem usuário");
  }
  return payload.sub;
}
