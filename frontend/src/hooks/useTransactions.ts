import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as transactionsService from '@/services/transactions'
import type { TransactionFilters, TransactionInput } from '@/types/finance'

export function useTransactions(filters: TransactionFilters) {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => transactionsService.list(filters),
    // Mantém a lista anterior na tela enquanto o novo filtro/página carrega
    placeholderData: keepPreviousData,
  })
}

// Transações mudam o saldo e a contagem das contas
function useInvalidateTransactions() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['transactions'] }),
      queryClient.invalidateQueries({ queryKey: ['accounts'] }),
      queryClient.invalidateQueries({ queryKey: ['reports'] }),
    ])
}

export function useSaveTransaction() {
  const invalidate = useInvalidateTransactions()
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: TransactionInput }) =>
      id ? transactionsService.update(id, data) : transactionsService.create(data),
    onSuccess: invalidate,
  })
}

export function useUpdateTransactionCategory() {
  const invalidate = useInvalidateTransactions()
  return useMutation({
    mutationFn: ({ id, categoryId }: { id: string; categoryId: string | null }) =>
      transactionsService.updateCategory(id, categoryId),
    onSuccess: invalidate,
  })
}

export function useDeleteTransaction() {
  const invalidate = useInvalidateTransactions()
  return useMutation({ mutationFn: transactionsService.remove, onSuccess: invalidate })
}
