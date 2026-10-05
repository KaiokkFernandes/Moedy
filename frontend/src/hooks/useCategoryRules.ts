import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as categoryRulesService from '@/services/categoryRules'
import type { CategoryRuleInput } from '@/types/import'

export function useCategoryRules() {
  return useQuery({ queryKey: ['category-rules'], queryFn: categoryRulesService.list })
}

export function useSaveCategoryRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: CategoryRuleInput }) =>
      id ? categoryRulesService.update(id, data) : categoryRulesService.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['category-rules'] }),
  })
}

export function useDeleteCategoryRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: categoryRulesService.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['category-rules'] }),
  })
}

export function useApplyCategoryRules() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: categoryRulesService.apply,
    // Aplicar as regras muda a categoria das transações
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions'] }),
  })
}
