import { AiError } from "./types.js";

/** Modelo padrão: classificação simples, barata e rápida. Pode ser trocado por AI_MODEL. */
export const AI_DEFAULT_MODEL = "claude-haiku-4-5-20251001";

/** Lançamentos por chamada à API. */
export const AI_BATCH_SIZE = 50;
/** Chamadas em paralelo por importação. */
export const AI_CONCURRENCY = 3;
/** Tentativas extras da SDK em erros temporários (429, 5xx, conexão). */
export const AI_MAX_RETRIES = 2;

function positiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function aiConfig() {
  return {
    modelo: process.env.AI_MODEL?.trim() || AI_DEFAULT_MODEL,
    /** Tempo limite de cada chamada, em ms. */
    timeoutMs: positiveInt(process.env.AI_TIMEOUT_MS, 20_000),
    /** Teto de lançamentos enviados à IA por importação ou sugestão. */
    maxTransacoes: positiveInt(process.env.AI_MAX_TRANSACTIONS, 500),
  };
}

/** A chave só é lida do ambiente; nunca vai para o frontend nem para os logs. */
export function aiApiKey(): string | null {
  return process.env.ANTHROPIC_API_KEY?.trim() || null;
}

export function describeAiError(error: unknown): { codigo: string; status?: number } {
  if (error instanceof AiError) return { codigo: error.codigo, status: error.status };
  return { codigo: "INESPERADO" };
}
