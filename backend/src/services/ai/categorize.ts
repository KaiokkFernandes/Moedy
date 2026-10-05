import { AI_BATCH_SIZE, AI_CONCURRENCY, describeAiError } from "./config.js";
import { chunk, groupByDescription, mapWithConcurrency, toAiPayload, type CategorizeInput } from "./batching.js";
import type { AiCategoryOption, AiRawSuggestion, Categorizer, Confianca } from "./types.js";

export type AiStatus = "OK" | "PARCIAL" | "FALHOU";

export interface AiOutcome {
  /** Sugestão crua por índice do lançamento (ainda não validada contra as categorias). */
  sugestoes: Map<number, AiRawSuggestion>;
  status: AiStatus;
  motivo: string | null;
  /** Lançamentos cobertos por lotes que deram certo. */
  enviadas: number;
  /** Lançamentos além do limite por importação, que não foram à IA. */
  naoEnviadas: number;
}

const MOTIVOS: Record<string, string> = {
  TEMPO_ESGOTADO: "a IA demorou demais para responder",
  API: "a API de IA recusou ou falhou na requisição",
  RESPOSTA_INVALIDA: "a IA devolveu uma resposta fora do formato esperado",
  INESPERADO: "ocorreu uma falha inesperada",
};

interface Options {
  maxTransacoes: number;
  batchSize?: number;
  concurrency?: number;
}

/**
 * Manda os lançamentos para a IA em lotes, com descrições iguais agrupadas (cada uma é
 * classificada uma vez só) e concorrência limitada. Falhas são isoladas por lote: um lote que
 * dá erro não impede os outros, e o resultado diz quantos lançamentos foram cobertos.
 */
export async function categorizeWithAi(
  categorizer: Categorizer,
  items: CategorizeInput[],
  categories: AiCategoryOption[],
  { maxTransacoes, batchSize = AI_BATCH_SIZE, concurrency = AI_CONCURRENCY }: Options,
): Promise<AiOutcome> {
  const enviados = items.slice(0, maxTransacoes);
  const naoEnviadas = items.length - enviados.length;

  const batches = chunk(groupByDescription(enviados), batchSize);
  const sugestoes = new Map<number, AiRawSuggestion>();
  const falhas: { codigo: string; status?: number }[] = [];
  let enviadas = 0;

  await mapWithConcurrency(batches, concurrency, async (batch) => {
    try {
      const respostas = await categorizer.categorize(toAiPayload(batch), categories);
      for (const resposta of respostas) {
        const group = batch[resposta.indice];
        if (!group) continue;
        for (const indice of group.indices) {
          sugestoes.set(indice, { indice, categoryId: resposta.categoryId, confianca: resposta.confianca });
        }
      }
      enviadas += batch.reduce((total, group) => total + group.indices.length, 0);
    } catch (error) {
      const erro = describeAiError(error);
      falhas.push(erro);
      // Só o código e o status HTTP: nada de descrições, valores ou chave
      console.warn(`[categorizacao-ia] lote falhou: ${erro.codigo}${erro.status ? ` (HTTP ${erro.status})` : ""}`);
    }
  });

  const status: AiStatus = falhas.length === 0 ? "OK" : falhas.length === batches.length ? "FALHOU" : "PARCIAL";
  const motivo = falhas.length > 0 ? (MOTIVOS[falhas[0]!.codigo] ?? MOTIVOS.INESPERADO!) : null;

  return { sugestoes, status, motivo, enviadas, naoEnviadas };
}

export interface ValidatedSuggestion {
  categoryId: string;
  confianca: Confianca;
}

export interface ValidationReport {
  descartadasInexistentes: number;
  descartadasTipoIncompativel: number;
  /** Confiança BAIXA: ficam sem categoria. */
  baixaConfianca: number;
}

/**
 * Confere cada sugestão da IA antes de usar:
 * - o categoryId precisa ser uma categoria do próprio usuário (a IA pode inventar um id);
 * - o tipo da categoria precisa ser o do lançamento (despesa não vira receita);
 * - confiança BAIXA não vira sugestão.
 */
export function validateAiSuggestions(
  raw: Map<number, AiRawSuggestion>,
  tipoByIndice: Map<number, "DESPESA" | "RECEITA">,
  categories: AiCategoryOption[],
): { sugestoes: Map<number, ValidatedSuggestion>; report: ValidationReport } {
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const sugestoes = new Map<number, ValidatedSuggestion>();
  const report: ValidationReport = { descartadasInexistentes: 0, descartadasTipoIncompativel: 0, baixaConfianca: 0 };

  for (const [indice, suggestion] of raw) {
    if (!suggestion.categoryId) continue;
    if (suggestion.confianca === "BAIXA") {
      report.baixaConfianca += 1;
      continue;
    }

    const category = categoryById.get(suggestion.categoryId);
    if (!category) {
      report.descartadasInexistentes += 1;
      continue;
    }
    if (category.tipo !== tipoByIndice.get(indice)) {
      report.descartadasTipoIncompativel += 1;
      continue;
    }

    sugestoes.set(indice, { categoryId: category.id, confianca: suggestion.confianca });
  }

  return { sugestoes, report };
}
