import { useMutation } from '@tanstack/react-query'
import * as importService from '@/services/import'
import type { CsvMapping, ImportItem } from '@/types/import'
import { useInvalidateFinance } from './useInvalidateFinance'

export function useImportPreview() {
  return useMutation({
    mutationFn: ({ accountId, file, mapeamento }: { accountId: string; file: File; mapeamento?: CsvMapping }) =>
      importService.preview(accountId, file, mapeamento),
  })
}

export function useImportConfirm() {
  const invalidate = useInvalidateFinance()
  return useMutation({
    mutationFn: ({ accountId, itens }: { accountId: string; itens: ImportItem[] }) =>
      importService.confirm(accountId, itens),
    onSuccess: invalidate,
  })
}
