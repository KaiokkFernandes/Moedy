import type { Category, TransactionType } from './finance'

/** Parâmetros comuns dos relatórios. Datas em AAAA-MM-DD. */
export interface ReportParams {
  dataInicio?: string
  dataFim?: string
  accountId?: string
}

interface Totals {
  receitas: number
  despesas: number
  saldo: number
}

export interface ReportSummary extends Totals {
  periodo: { dataInicio: string; dataFim: string }
  anterior: Totals & { dataInicio: string; dataFim: string }
  /** Variação percentual vs período anterior; `null` quando não há base de comparação. */
  variacao: { receitas: number | null; despesas: number | null; saldo: number | null }
  saldoContas: { inicio: number; fim: number; variacao: number | null }
}

export interface CategoryTotal {
  /** `null` = transações sem categoria. */
  categoryId: string | null
  nome: string
  cor: string
  icone: string
  total: number
  percentual: number
  quantidade: number
}

export interface ByCategoryReport {
  tipo: TransactionType
  total: number
  categorias: CategoryTotal[]
}

export interface MonthlyReport {
  meses: { mes: string; receitas: number; despesas: number; saldo: number }[]
}

interface DailyMonth {
  mes: string
  total: number
  dias: { dia: number; total: number; acumulado: number }[]
}

export interface DailyReport {
  mesAtual: DailyMonth
  mesAnterior: DailyMonth
}

export interface TopMerchantsReport {
  total: number
  estabelecimentos: { nome: string; total: number; quantidade: number; percentual: number }[]
}

export interface RecurringReport {
  periodo: { dataInicio: string; dataFim: string }
  totalMensal: number
  totalAnual: number
  recorrentes: {
    nome: string
    valorMedio: number
    ultimoValor: number
    ultimaCobranca: string
    mesesSeguidos: number
    custoAnual: number
  }[]
}

export interface CategoryTrendReport {
  categoria: Pick<Category, 'nome' | 'cor' | 'icone' | 'tipo'> & { id: string | null }
  meses: { mes: string; total: number; quantidade: number }[]
}
