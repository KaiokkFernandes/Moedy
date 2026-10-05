/*
 * Contrato do categorizador por IA. Quem chama só conhece estes tipos; trocar de provedor
 * (Anthropic, outro modelo) é trocar a implementação de `Categorizer`.
 */

export type Confianca = "ALTA" | "MEDIA" | "BAIXA";

export interface AiCategoryOption {
  id: string;
  nome: string;
  tipo: "DESPESA" | "RECEITA";
}

/**
 * O único conteúdo que sai do servidor por lançamento: índice, descrição, valor e tipo.
 * Nada de nome, e-mail, conta, saldo ou identificadores do banco.
 */
export interface AiTransactionInput {
  indice: number;
  descricao: string;
  /** Centavos. */
  valor: number;
  tipo: "DESPESA" | "RECEITA";
}

/** Resposta crua do modelo, antes da validação contra as categorias do usuário. */
export interface AiRawSuggestion {
  indice: number;
  categoryId: string | null;
  confianca: Confianca;
}

export interface Categorizer {
  readonly modelo: string;
  categorize(items: AiTransactionInput[], categories: AiCategoryOption[]): Promise<AiRawSuggestion[]>;
}

export type AiErrorCode = "TEMPO_ESGOTADO" | "API" | "RESPOSTA_INVALIDA";

/** Falha de uma chamada à IA. A mensagem não carrega dados do usuário nem a chave. */
export class AiError extends Error {
  constructor(
    readonly codigo: AiErrorCode,
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "AiError";
  }
}
