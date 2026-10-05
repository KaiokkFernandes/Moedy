import type { Confianca, IaStatus, OrigemCategoria } from './import'

export interface AiSettings {
  usarIaImportacao: boolean
  iaConsentidaEm: string | null
  /** Se o servidor tem a chave configurada. A chave em si nunca chega ao app. */
  iaDisponivel: boolean
  modelo: string
}

export interface AiSettingsInput {
  usarIaImportacao: boolean
  confirmaEnvioAnthropic?: boolean
}

export interface TransactionSuggestion {
  transactionId: string
  descricao: string
  valor: number
  tipo: 'DESPESA' | 'RECEITA'
  /** AAAA-MM-DD */
  data: string
  categoryId: string
  origem: Exclude<OrigemCategoria, 'MANUAL'>
  confianca: Confianca | null
}

export interface TransactionSuggestionsResult {
  itens: TransactionSuggestion[]
  semSugestao: number
  total: number
  naoAnalisadas: number
  ia: { status: IaStatus; motivo: string | null; enviadas: number; naoEnviadas: number }
}
