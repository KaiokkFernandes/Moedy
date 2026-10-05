import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as categoriesService from '@/services/categories'
import type { CategoryInput } from '@/types/finance'

export function useCategories() {
  return useQuery({ queryKey: ['categories'], queryFn: categoriesService.list })
}

// Nome, cor e ícone da categoria aparecem nas transações e nas regras (excluir a categoria apaga as regras dela)
function useInvalidateCategories() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['categories'] }),
      queryClient.invalidateQueries({ queryKey: ['transactions'] }),
      queryClient.invalidateQueries({ queryKey: ['category-rules'] }),
      queryClient.invalidateQueries({ queryKey: ['reports'] }),
    ])
}

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
