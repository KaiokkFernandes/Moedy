import { api } from '@/lib/api'
import type { Transaction, TransactionType } from '@/types/finance'
import type {
  ByCategoryReport,
  CategoryTrendReport,
  DailyReport,
  MonthlyReport,
  RecurringReport,
  ReportParams,
  ReportSummary,
  TopMerchantsReport,
} from '@/types/reports'

async function get<T>(path: string, params: object) {
  return (await api.get<T>(`/reports/${path}`, { params })).data
}

export const summary = (params: ReportParams) => get<ReportSummary>('summary', params)

export const byCategory = (params: ReportParams & { tipo: TransactionType }) =>
  get<ByCategoryReport>('by-category', params)

export const monthly = (params: ReportParams & { meses: number }) => get<MonthlyReport>('monthly', params)

export const daily = (params: ReportParams) => get<DailyReport>('daily', params)

export const topMerchants = (params: ReportParams & { limite: number }) =>
  get<TopMerchantsReport>('top-merchants', params)

export const largestExpenses = (params: ReportParams & { limite: number }) =>
  get<Transaction[]>('largest-expenses', params)

export const recurring = (params: ReportParams) => get<RecurringReport>('recurring', params)

export const categoryTrend = (
  params: ReportParams & { categoryId?: string; semCategoria?: boolean; tipo: TransactionType; meses: number },
) => get<CategoryTrendReport>('category-trend', params)

/** Baixa o CSV das transações do período e devolve o arquivo com o nome sugerido pela API. */
export async function exportCsv(params: ReportParams) {
  const response = await api.get<Blob>('/reports/export', { params, responseType: 'blob' })
  const disposition = String(response.headers['content-disposition'] ?? '')
  const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? 'transacoes.csv'
  return { blob: response.data, filename }
}
