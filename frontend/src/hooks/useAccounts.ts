import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as accountsService from '@/services/accounts'
import type { AccountInput } from '@/types/finance'

export function useAccounts() {
  return useQuery({ queryKey: ['accounts'], queryFn: accountsService.list })
}

// O nome da conta aparece nas transações, e excluir a conta apaga as transações dela
function useInvalidateAccounts() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['accounts'] }),
      queryClient.invalidateQueries({ queryKey: ['transactions'] }),
      queryClient.invalidateQueries({ queryKey: ['reports'] }),
    ])
}

export function useSaveAccount() {
  const invalidate = useInvalidateAccounts()
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: AccountInput }) =>
      id ? accountsService.update(id, data) : accountsService.create(data),
    onSuccess: invalidate,
  })
}

export function useDeleteAccount() {
  const invalidate = useInvalidateAccounts()
  return useMutation({
    mutationFn: ({ id, confirm }: { id: string; confirm: boolean }) => accountsService.remove(id, confirm),
    onSuccess: invalidate,
  })
}
