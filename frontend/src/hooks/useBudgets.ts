import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as budgetsService from '@/services/budgets'
import type { BudgetInput } from '@/types/budgets'

interface Month {
  mes: number
  ano: number
}

export function useBudgets(month: Month) {
  return useQuery({
    queryKey: ['budgets', 'list', month],
    queryFn: () => budgetsService.list(month),
    placeholderData: keepPreviousData,
  })
}

export function useBudgetSuggestions(month: Month) {
  return useQuery({ queryKey: ['budgets', 'suggestions', month], queryFn: () => budgetsService.suggestions(month) })
}

// Criar ou mudar um orçamento só afeta as listas de orçamentos (os alertas nascem das transações)
function useInvalidateBudgets() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['budgets'] })
}

export function useSaveBudget() {
  const invalidate = useInvalidateBudgets()
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: BudgetInput }) =>
      id ? budgetsService.update(id, data) : budgetsService.create(data),
    onSuccess: invalidate,
  })
}

export function useDeleteBudget() {
  const invalidate = useInvalidateBudgets()
  return useMutation({ mutationFn: budgetsService.remove, onSuccess: invalidate })
}

export function useCopyBudgets() {
  const invalidate = useInvalidateBudgets()
  return useMutation({
    mutationFn: ({ from, to }: { from: Month; to: Month }) => budgetsService.copy(from, to),
    onSuccess: invalidate,
  })
}

export function useCreateBudgetsFromSuggestions() {
  const invalidate = useInvalidateBudgets()
  return useMutation({ mutationFn: budgetsService.createFromSuggestions, onSuccess: invalidate })
}
