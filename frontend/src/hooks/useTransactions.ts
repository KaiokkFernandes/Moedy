import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import * as transactionsService from '@/services/transactions'
import type { TransactionFilters, TransactionInput } from '@/types/finance'
import { useInvalidateFinance } from './useInvalidateFinance'

export function useTransactions(filters: TransactionFilters) {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => transactionsService.list(filters),
    // Mantém a lista anterior na tela enquanto o novo filtro/página carrega
    placeholderData: keepPreviousData,
  })
}

export function useSaveTransaction() {
  const invalidate = useInvalidateFinance()
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: TransactionInput }) =>
      id ? transactionsService.update(id, data) : transactionsService.create(data),
    onSuccess: invalidate,
  })
}

export function useUpdateTransactionCategory() {
  const invalidate = useInvalidateFinance()
  return useMutation({
    mutationFn: ({ id, categoryId, origem }: { id: string; categoryId: string | null; origem?: "MANUAL" | "IA" }) =>
      transactionsService.updateCategory(id, categoryId, origem),
    onSuccess: invalidate,
  })
}

export function useDeleteTransaction() {
  const invalidate = useInvalidateFinance()
  return useMutation({ mutationFn: transactionsService.remove, onSuccess: invalidate })
}
