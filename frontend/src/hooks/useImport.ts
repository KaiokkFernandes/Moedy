import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as importService from '@/services/import'
import type { CsvMapping, ImportItem } from '@/types/import'

export function useImportPreview() {
  return useMutation({
    mutationFn: ({ accountId, file, mapeamento }: { accountId: string; file: File; mapeamento?: CsvMapping }) =>
      importService.preview(accountId, file, mapeamento),
  })
}

export function useImportConfirm() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ accountId, itens }: { accountId: string; itens: ImportItem[] }) =>
      importService.confirm(accountId, itens),
    // As transações importadas mudam as listas e o saldo da conta
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['accounts'] }),
        queryClient.invalidateQueries({ queryKey: ['reports'] }),
      ]),
  })
}
