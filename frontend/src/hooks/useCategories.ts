import { useMutation, useQuery } from '@tanstack/react-query'
import * as categoriesService from '@/services/categories'
import type { CategoryInput } from '@/types/finance'
import { useInvalidateFinance } from './useInvalidateFinance'

export function useCategories() {
  return useQuery({ queryKey: ['categories'], queryFn: categoriesService.list })
}

// Nome, cor e ícone da categoria aparecem nas transações, nos relatórios, nos orçamentos e nas
// regras (excluir a categoria apaga as regras e os orçamentos dela)
const useInvalidateCategories = () => useInvalidateFinance('categories', 'category-rules')

export function useSaveCategory() {
  const invalidate = useInvalidateCategories()
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: CategoryInput }) =>
      id ? categoriesService.update(id, data) : categoriesService.create(data),
    onSuccess: invalidate,
  })
}

export function useDeleteCategory() {
  const invalidate = useInvalidateCategories()
  return useMutation({ mutationFn: categoriesService.remove, onSuccess: invalidate })
}
