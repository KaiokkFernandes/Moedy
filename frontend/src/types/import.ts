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

/** De onde veio a categoria: escolha manual, regra, memória de escolhas anteriores ou IA. */
export type OrigemCategoria = 'MANUAL' | 'REGRA' | 'MEMORIA' | 'IA'
export type Confianca = 'ALTA' | 'MEDIA' | 'BAIXA'
/** DESLIGADA: IA desligada pelo usuário. SEM_CHAVE: o servidor não tem a chave. */
export type IaStatus = 'DESLIGADA' | 'SEM_CHAVE' | 'OK' | 'PARCIAL' | 'FALHOU'

export interface IaSummary {
  status: IaStatus
  motivo: string | null
  enviadas: number
  naoEnviadas: number
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
  /** Categoria sugerida (ou escolhida pelo usuário na revisão). */
  categoryId: string | null
  /** Origem da categoria atual; `null` quando não há categoria. */
  origemCategoria: OrigemCategoria | null
  /** Confiança da IA (só quando a origem é IA). */
  confianca: Confianca | null
  /** Sugerido pela API para pagamentos de fatura e transferências; o usuário pode mudar na revisão. */
  ignorarNosRelatorios: boolean
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
  resumo: {
    total: number
    novas: number
    duplicadas: number
    comErro: number
    /** Novas com categoria, por origem. */
    porOrigem: Record<Exclude<OrigemCategoria, 'MANUAL'>, number>
    semCategoria: number
  }
  ia: IaSummary
}

export type ImportPreview = CsvMappingStep | ImportReview

export interface ImportResult {
  importadas: number
  ignoradas: number
  /** Alertas novos gerados pela importação (orçamentos, despesas atípicas, recorrentes). */
  alertas: number
}
