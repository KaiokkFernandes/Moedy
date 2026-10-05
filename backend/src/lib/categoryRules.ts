import type { TransactionType } from "../generated/prisma/client.js";
import { normalizeText } from "./text.js";

interface RuleForMatching {
  palavraChave: string;
  categoryId: string;
  category: { tipo: TransactionType };
}

/** Palavras-chave até este tamanho só casam como palavra inteira ("99" não casa com "1999"). */
const WHOLE_WORD_MAX_LENGTH = 3;

function escapeRegex(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Prepara as regras do usuário e devolve uma função que sugere a categoria de uma transação.
 * - A comparação ignora maiúsculas/minúsculas e acentos.
 * - Só valem regras cuja categoria é do mesmo tipo (despesa/receita) da transação.
 * - Quando mais de uma regra bate, vence a palavra-chave mais longa.
 */
export function createRuleMatcher(rules: RuleForMatching[]) {
  const prepared = rules
    .map((rule) => {
      const keyword = normalizeText(rule.palavraChave);
      return {
        keyword,
        categoryId: rule.categoryId,
        tipo: rule.category.tipo,
        matches:
          keyword.length <= WHOLE_WORD_MAX_LENGTH
            ? (text: string) => new RegExp(`(^|[^a-z0-9])${escapeRegex(keyword)}($|[^a-z0-9])`).test(text)
            : (text: string) => text.includes(keyword),
      };
    })
    .filter((rule) => rule.keyword)
    // Mais longas primeiro; em empate, ordem alfabética para o resultado ser sempre o mesmo
    .sort((a, b) => b.keyword.length - a.keyword.length || a.keyword.localeCompare(b.keyword));

  return (descricao: string, tipo: TransactionType): string | null => {
    const text = normalizeText(descricao);
    return prepared.find((rule) => rule.tipo === tipo && rule.matches(text))?.categoryId ?? null;
  };
}
