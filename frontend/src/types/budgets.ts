import type { Category } from './finance'

export type BudgetStatus = 'OK' | 'ATENCAO' | 'ESTOURADO'

type CategoryInfo = Pick<Category, 'id' | 'nome' | 'cor' | 'icone'>

export interface Budget {
  id: string
  categoryId: string
  categoria: CategoryInfo
  mes: number
  ano: number
  /** Valores em centavos. */
  valorLimite: number
  gasto: number
  /** Negativo quando o orçamento estourou. */
  restante: number
  percentual: number
  status: BudgetStatus
  /** Só no mês atual: quanto deve fechar no ritmo atual de gasto. */
  projecao: { valor: number; vaiEstourar: boolean } | null
}

export interface BudgetList {
  mes: number
  ano: number
  mesAtual: boolean
  resumo: {
    totalOrcado: number
    /** Gasto nas categorias que têm orçamento. */
    totalGasto: number
    restante: number
    percentual: number
    gastoSemOrcamento: number
  }
  orcamentos: Budget[]
  /** Categorias com gasto no mês e sem orçamento (`categoryId` nulo = sem categoria). */
  semOrcamento: { categoryId: string | null; nome: string; cor: string; icone: string; gasto: number }[]
}

export interface BudgetInput {
  categoryId: string
  valorLimite: number
  mes: number
  ano: number
}

export interface BudgetSuggestion {
  categoryId: string
  nome: string
  cor: string
  icone: string
  /** Gasto médio por mês nos últimos 3 meses. */
  media: number
  /** `null` quando não houve gasto para basear a sugestão. */
  sugestao: number | null
  temOrcamento: boolean
}

export type NotificationType =
  | 'ORCAMENTO_ATENCAO'
  | 'ORCAMENTO_ESTOURADO'
  | 'ORCAMENTO_PROJECAO'
  | 'DESPESA_ATIPICA'
  | 'RECORRENTE_NOVA'
  | 'RECORRENTE_VALOR'

export interface AppNotification {
  id: string
  tipo: NotificationType
  titulo: string
  mensagem: string
  /** Caminho da página relacionada no app. */
  link: string | null
  lida: boolean
  createdAt: string
}

export interface NotificationList {
  itens: AppNotification[]
  total: number
  naoLidas: number
}
