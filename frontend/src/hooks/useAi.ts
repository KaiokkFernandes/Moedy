import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as aiService from '@/services/ai'
import type { AiSettingsInput } from '@/types/ai'
import type { TransactionFilters } from '@/types/finance'

export function useAiSettings() {
  return useQuery({ queryKey: ['ai-settings'], queryFn: aiService.getSettings })
}

export function useUpdateAiSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AiSettingsInput) => aiService.updateSettings(data),
    onSuccess: (settings) => {
      queryClient.setQueryData(['ai-settings'], settings)
    },
  })
}

export function useSuggestForTransactions() {
  return useMutation({
    mutationFn: (filters: Pick<TransactionFilters, 'dataInicio' | 'dataFim' | 'accountId' | 'tipo' | 'busca'>) =>
      aiService.suggestForTransactions(filters),
  })
}
