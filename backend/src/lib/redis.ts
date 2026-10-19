import { Redis } from "ioredis";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

/**
 * Conexão com o Redis, quando REDIS_URL existe. Usada só pelos contadores de limite de
 * requisições, que precisam ser compartilhados entre as instâncias da Vercel.
 */
export const redis = env.REDIS_URL
  ? new Redis(env.REDIS_URL, {
      // Falha rápido em vez de segurar a requisição: o limite deixa passar quando o Redis cai
      maxRetriesPerRequest: 1,
      connectTimeout: 5_000,
    })
  : null;

let avisado = false;
redis?.on("error", (erro) => {
  // Sem este ouvinte, um erro de conexão derrubaria o processo. Avisa uma vez por queda.
  if (avisado) return;
  avisado = true;
  logger.warn({ err: erro }, "Redis indisponível: os limites de requisição deixam passar até ele voltar");
});
redis?.on("ready", () => {
  avisado = false;
});
