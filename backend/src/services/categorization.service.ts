import { prisma } from "../lib/prisma.js";
import {
  aiConfig,
  categorizeWithAi,
  createCategorizer,
  validateAiSuggestions,
  type Categorizer,
  type Confianca,
  type ValidationReport,
} from "./ai/index.js";
import { getMatcher } from "./categoryRule.service.js";
import { loadMemory, memoryKey } from "./categoryMemory.service.js";

export type OrigemSugestao = "REGRA" | "MEMORIA" | "IA";
/** DESLIGADA: o usuário não ligou a IA. SEM_CHAVE: o servidor não tem ANTHROPIC_API_KEY. */
export type IaStatus = "DESLIGADA" | "SEM_CHAVE" | "OK" | "PARCIAL" | "FALHOU";

export interface CategorizeItem {
  indice: number;
  descricao: string;
  valor: number;
  tipo: "DESPESA" | "RECEITA";
}

export interface SugestaoCategoria {
  categoryId: string;
  origem: OrigemSugestao;
  /** Só existe quando a origem é a IA. */
  confianca: Confianca | null;
}

export interface SuggestResult {
  sugestoes: Map<number, SugestaoCategoria>;
  ia: {
    status: IaStatus;
    motivo: string | null;
    /** Lançamentos que a IA classificou com sucesso. */
    enviadas: number;
    /** Lançamentos que não foram à IA (IA desligada, sem chave ou além do limite). */
    naoEnviadas: number;
    descartadas: ValidationReport | null;
  };
}

interface Options {
  /** Liga a IA para esta chamada (depende da preferência do usuário). */
  usarIa: boolean;
  /** Undefined = usa o ambiente; null = sem IA disponível. Injetável nos testes. */
  categorizer?: Categorizer | null;
  maxTransacoes?: number;
}

/**
 * Sugere categorias na ordem: regras do usuário, memória das escolhas anteriores e, só para o
 * que sobrou, a IA. Nada é gravado aqui: o resultado é uma sugestão para o usuário revisar.
 */
export async function suggestCategories(
  userId: string,
  items: CategorizeItem[],
  { usarIa, categorizer, maxTransacoes }: Options,
): Promise<SuggestResult> {
  const [categories, match, memory] = await Promise.all([
    prisma.category.findMany({ where: { userId }, select: { id: true, nome: true, tipo: true } }),
    getMatcher(userId),
    loadMemory(userId),
  ]);

  const sugestoes = new Map<number, SugestaoCategoria>();
  const pendentes: CategorizeItem[] = [];

  for (const item of items) {
    const porRegra = match(item.descricao, item.tipo);
    if (porRegra) {
      sugestoes.set(item.indice, { categoryId: porRegra, origem: "REGRA", confianca: null });
      continue;
    }

    const categoryId = memory.get(memoryKey(item.descricao, item.tipo));
    const categoriaValida = categories.some((category) => category.id === categoryId && category.tipo === item.tipo);
    if (categoryId && categoriaValida) {
      sugestoes.set(item.indice, { categoryId, origem: "MEMORIA", confianca: null });
      continue;
    }

    pendentes.push(item);
  }

  const semIa = (status: IaStatus): SuggestResult => ({
    sugestoes,
    ia: { status, motivo: null, enviadas: 0, naoEnviadas: pendentes.length, descartadas: null },
  });

  if (!usarIa) return semIa("DESLIGADA");
  if (pendentes.length === 0) return semIa("OK");

  const ai = categorizer === undefined ? createCategorizer() : categorizer;
  if (!ai) return semIa("SEM_CHAVE");

  const outcome = await categorizeWithAi(ai, pendentes, categories, {
    maxTransacoes: maxTransacoes ?? aiConfig().maxTransacoes,
  });

  const tipoByIndice = new Map(pendentes.map((item) => [item.indice, item.tipo]));
  const { sugestoes: validas, report } = validateAiSuggestions(outcome.sugestoes, tipoByIndice, categories);
  for (const [indice, suggestion] of validas) {
    sugestoes.set(indice, { categoryId: suggestion.categoryId, origem: "IA", confianca: suggestion.confianca });
  }

  return {
    sugestoes,
    ia: {
      status: outcome.status,
      motivo: outcome.motivo,
      enviadas: outcome.enviadas,
      naoEnviadas: outcome.naoEnviadas,
      descartadas: report,
    },
  };
}
