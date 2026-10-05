import { useMutation, useQuery } from '@tanstack/react-query'
import * as accountsService from '@/services/accounts'
import type { AccountInput } from '@/types/finance'
import { useInvalidateFinance } from './useInvalidateFinance'

export function useAccounts() {
  return useQuery({ queryKey: ['accounts'], queryFn: accountsService.list })
}

export function useSaveAccount() {
  // O nome da conta aparece nas transações
  const invalidate = useInvalidateFinance()
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: AccountInput }) =>
      id ? accountsService.update(id, data) : accountsService.create(data),
    onSuccess: invalidate,
  })
}

export function useDeleteAccount() {
  // Excluir a conta apaga as transações dela
  const invalidate = useInvalidateFinance()
  return useMutation({
    mutationFn: ({ id, confirm }: { id: string; confirm: boolean }) => accountsService.remove(id, confirm),
    onSuccess: invalidate,
  })
}
