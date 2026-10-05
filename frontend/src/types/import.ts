import type { Category, TransactionType } from './finance'

export interface CategoryRule {
  id: string
  palavraChave: string
  categoryId: string
  category: Pick<Category, 'id' | 'nome' | 'cor' | 'icone' | 'tipo'>
}

export interface CategoryRuleInput {
  palavraChave: string
  categoryId: string
}

export interface ApplyRulesResult {
  categorizadas: number
  /** Transações que continuam sem categoria depois de aplicar as regras. */
  semCategoria: number
}

/** Índice (a partir de 0) da coluna do CSV com cada informação. */
export interface CsvMapping {
  data: number
  descricao: number
  valor?: number
  entrada?: number
  saida?: number
}

export interface ImportItem {
  linha: number
  /** AAAA-MM-DD */
  data: string
  descricao: string
  /** Centavos, sempre positivo. */
  valor: number
  tipo: TransactionType
  externalId: string
  /** Categoria sugerida pelas regras (ou escolhida pelo usuário na revisão). */
  categoryId: string | null
  /** Já existe na conta de destino. */
  duplicada: boolean
}

/** Resposta do preview quando o CSV ainda precisa ter as colunas mapeadas. */
export interface CsvMappingStep {
  formato: 'csv'
  etapa: 'mapeamento'
  separador: string
  cabecalhos: string[]
  amostra: string[][]
  totalLinhas: number
  mapeamentoSugerido: Partial<CsvMapping>
}

export interface ImportReview {
  formato: 'ofx' | 'csv'
  etapa: 'revisao'
  itens: ImportItem[]
  erros: { linha: number; motivo: string }[]
  resumo: { total: number; novas: number; duplicadas: number; comErro: number }
}

export type ImportPreview = CsvMappingStep | ImportReview

export interface ImportResult {
  importadas: number
  ignoradas: number
}
