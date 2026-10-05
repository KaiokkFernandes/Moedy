import { keepPreviousData, useQuery } from '@tanstack/react-query'
import * as reportsService from '@/services/reports'

/**
 * Um hook por relatório. Todos ficam sob a chave ['reports'], invalidada sempre que
 * transações, contas ou categorias mudam. Ao trocar o filtro, o resultado anterior
 * continua na tela (esmaecido) até o novo chegar.
 */
function useReport<P extends object, T>(name: string, fetcher: (params: P) => Promise<T>, params: P, enabled = true) {
  return useQuery({
    queryKey: ['reports', name, params],
    queryFn: () => fetcher(params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

type Params<F extends (params: never) => unknown> = Parameters<F>[0]

export const useReportSummary = (params: Params<typeof reportsService.summary>) =>
  useReport('summary', reportsService.summary, params)

export const useReportByCategory = (params: Params<typeof reportsService.byCategory>) =>
  useReport('by-category', reportsService.byCategory, params)

export const useReportMonthly = (params: Params<typeof reportsService.monthly>) =>
  useReport('monthly', reportsService.monthly, params)

export const useReportDaily = (params: Params<typeof reportsService.daily>) =>
  useReport('daily', reportsService.daily, params)

export const useReportTopMerchants = (params: Params<typeof reportsService.topMerchants>) =>
  useReport('top-merchants', reportsService.topMerchants, params)

export const useReportLargestExpenses = (params: Params<typeof reportsService.largestExpenses>) =>
  useReport('largest-expenses', reportsService.largestExpenses, params)

export const useReportRecurring = (params: Params<typeof reportsService.recurring>) =>
  useReport('recurring', reportsService.recurring, params)

export const useReportCategoryTrend = (params: Params<typeof reportsService.categoryTrend>, enabled: boolean) =>
  useReport('category-trend', reportsService.categoryTrend, params, enabled)
