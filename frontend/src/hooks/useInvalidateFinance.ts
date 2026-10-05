import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'

/**
 * Tudo o que depende das transações: saldos das contas, listas, relatórios, gasto dos
 * orçamentos e alertas (a API gera alertas ao salvar transações e ao importar).
 */
const FINANCE_KEYS = ['accounts', 'transactions', 'reports', 'budgets', 'notifications']

/**
 * Devolve a função que as mutations chamam ao terminar, para recarregar os dados afetados.
 * `extraKeys` acrescenta outras listas (ex.: 'categories').
 */
export function useInvalidateFinance(...extraKeys: string[]) {
  const queryClient = useQueryClient()
  const keys = [...FINANCE_KEYS, ...extraKeys].join(',')

  return useCallback(
    () => Promise.all(keys.split(',').map((key) => queryClient.invalidateQueries({ queryKey: [key] }))),
    [queryClient, keys],
  )
}
