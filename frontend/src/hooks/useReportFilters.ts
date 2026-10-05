import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { thisMonth } from '@/lib/periods'
import type { TransactionType } from '@/types/finance'

export const REPORT_TABS = [
  { id: 'categorias', label: 'Categorias' },
  { id: 'evolucao', label: 'Evolução' },
  { id: 'estabelecimentos', label: 'Estabelecimentos' },
  { id: 'recorrentes', label: 'Recorrentes' },
] as const

export type ReportTab = (typeof REPORT_TABS)[number]['id']

/** Valor do parâmetro `categoria` que significa "transações sem categoria". */
export const SEM_CATEGORIA = 'sem'

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
const UUID_REGEX = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i

/**
 * Filtros e aba da página de relatórios, guardados na URL:
 *   ?inicio=2026-09-01&fim=2026-09-30&conta=<id>&aba=evolucao&tipo=RECEITA&categoria=<id|sem>
 * Sem `inicio`/`fim` (ou com datas inválidas), o período é o mês atual.
 */
export function useReportFilters() {
  const [params, setParams] = useSearchParams()

  const values = useMemo(() => {
    const matching = (key: string, regex: RegExp) => {
      const value = params.get(key) ?? ''
      return regex.test(value) ? value : ''
    }

    const inicio = matching('inicio', DATE_REGEX)
    const fim = matching('fim', DATE_REGEX)
    const periodo = inicio && fim && inicio <= fim ? { inicio, fim } : thisMonth()

    const aba = REPORT_TABS.find((tab) => tab.id === params.get('aba'))?.id ?? 'categorias'
    const tipo: TransactionType = params.get('tipo') === 'RECEITA' ? 'RECEITA' : 'DESPESA'
    const categoria = params.get('categoria') === SEM_CATEGORIA ? SEM_CATEGORIA : matching('categoria', UUID_REGEX)

    return { ...periodo, conta: matching('conta', UUID_REGEX), aba, tipo, categoria }
  }, [params])

  /** Altera parâmetros da URL (valor vazio remove). */
  const update = useCallback(
    (patch: Record<string, string | null>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const [key, value] of Object.entries(patch)) {
            if (value) next.set(key, value)
            else next.delete(key)
          }
          return next
        },
        { replace: true },
      )
    },
    [setParams],
  )

  /** Parâmetros de período e conta, no formato da API. */
  const range = useMemo(
    () => ({ dataInicio: values.inicio, dataFim: values.fim, accountId: values.conta || undefined }),
    [values.inicio, values.fim, values.conta],
  )

  return { values, range, update }
}
