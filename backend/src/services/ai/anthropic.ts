import Anthropic, { APIConnectionTimeoutError, APIError } from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { buildSystemPrompt } from "./prompt.js";
import {
  AiError,
  type AiCategoryOption,
  type AiRawSuggestion,
  type AiTransactionInput,
  type Categorizer,
} from "./types.js";

/** Formato da resposta. Conferido de novo com Zod depois que a SDK devolve o resultado. */
export const RESPONSE_SCHEMA = z.object({
  itens: z.array(
    z.object({
      indice: z.number().int().min(0),
      categoryId: z.string().nullable(),
      confianca: z.enum(["ALTA", "MEDIA", "BAIXA"]),
    }),
  ),
});

const MAX_OUTPUT_TOKENS = 4096;

/** Categorizador usando a API da Anthropic (saída estruturada, validada com Zod). */
export class AnthropicCategorizer implements Categorizer {
  constructor(
    private readonly client: Pick<Anthropic, "messages">,
    readonly modelo: string,
    private readonly timeoutMs: number,
  ) {}

  async categorize(items: AiTransactionInput[], categories: AiCategoryOption[]): Promise<AiRawSuggestion[]> {
    let response: Awaited<ReturnType<Anthropic["messages"]["parse"]>>;
    try {
      response = await this.client.messages.parse(
        {
          model: this.modelo,
          max_tokens: MAX_OUTPUT_TOKENS,
          system: [
            { type: "text", text: buildSystemPrompt(categories), cache_control: { type: "ephemeral" } },
          ],
          // Só o JSON dos lançamentos: as descrições ficam dentro de um JSON, não viram texto livre
          messages: [
            {
              role: "user",
              content: `Lançamentos (valor em centavos):\n${JSON.stringify(items)}`,
            },
          ],
          output_config: { format: zodOutputFormat(RESPONSE_SCHEMA) },
        },
        { timeout: this.timeoutMs },
      );
    } catch (error) {
      throw toAiError(error);
    }

    const parsed = RESPONSE_SCHEMA.safeParse(response.parsed_output);
    if (!parsed.success) {
      throw new AiError("RESPOSTA_INVALIDA", "A resposta da IA veio fora do formato esperado");
    }
    return parsed.data.itens;
  }
}

function toAiError(error: unknown): AiError {
  // A checagem de tempo vem antes: a SDK classifica o timeout como erro de conexão
  if (error instanceof APIConnectionTimeoutError) {
    return new AiError("TEMPO_ESGOTADO", "A IA demorou demais para responder");
  }
  if (error instanceof APIError) {
    return new AiError("API", "A API da Anthropic falhou na requisição", error.status);
  }
  return new AiError("API", "Falha inesperada ao consultar a IA");
}
