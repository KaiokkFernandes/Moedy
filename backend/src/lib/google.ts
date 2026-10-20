import { createRemoteJWKSet, errors, jwtVerify, type JWTVerifyGetKey } from "jose";
import { AppError } from "../middlewares/errorHandler.js";

/** Chaves públicas com que o Google assina os tokens de login (o jose guarda em cache). */
const CHAVES_DO_GOOGLE = new URL("https://www.googleapis.com/oauth2/v3/certs");
const EMISSORES = ["https://accounts.google.com", "accounts.google.com"];

export interface PerfilGoogle {
  /** Identificador fixo da conta Google (claim "sub"); o email pode mudar, ele não. */
  googleId: string;
  email: string;
  nome: string;
}

export type VerificadorGoogle = (credencial: string) => Promise<PerfilGoogle>;

/**
 * Confere o token (ID token) que o botão do Google entrega ao frontend: assinatura do Google,
 * emissor, validade e se foi emitido para este app (audience = GOOGLE_CLIENT_ID). Só aceita
 * contas com email verificado pelo Google, porque o email é o que liga a uma conta existente.
 */
export function criarVerificadorGoogle(clientId: string, chaves: JWTVerifyGetKey = createRemoteJWKSet(CHAVES_DO_GOOGLE)): VerificadorGoogle {
  return async (credencial) => {
    let payload;
    try {
      ({ payload } = await jwtVerify(credencial, chaves, { issuer: EMISSORES, audience: clientId, algorithms: ["RS256"] }));
    } catch (erro) {
      // Falha ao buscar as chaves do Google é problema do servidor, não do token
      if (erro instanceof errors.JWKSTimeout || (erro instanceof Error && !(erro instanceof errors.JOSEError))) throw erro;
      throw new AppError("Não foi possível confirmar o login com o Google. Tente de novo.", 401);
    }

    if (typeof payload.sub !== "string" || typeof payload.email !== "string" || payload.email_verified !== true) {
      throw new AppError("A conta Google precisa ter um email verificado.", 401);
    }
    const email = payload.email.trim().toLowerCase();
    const nome = typeof payload.name === "string" && payload.name.trim() ? payload.name.trim() : email.split("@")[0];
    return { googleId: payload.sub, email, nome: nome.slice(0, 100) };
  };
}
