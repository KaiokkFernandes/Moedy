import Anthropic from "@anthropic-ai/sdk";
import { AnthropicCategorizer } from "./anthropic.js";
import { AI_MAX_RETRIES, aiApiKey, aiConfig } from "./config.js";
import type { Categorizer } from "./types.js";

export * from "./types.js";
export * from "./categorize.js";
export { aiConfig, aiApiKey } from "./config.js";

/**
 * Categorizador configurado pelo ambiente, ou `null` quando não há ANTHROPIC_API_KEY.
 * Quem chama trata o `null` como "IA indisponível" e segue só com regras e memória.
 */
export function createCategorizer(): Categorizer | null {
  const apiKey = aiApiKey();
  if (!apiKey) return null;

  const { modelo, timeoutMs } = aiConfig();
  const client = new Anthropic({ apiKey, maxRetries: AI_MAX_RETRIES });
  return new AnthropicCategorizer(client, modelo, timeoutMs);
}
