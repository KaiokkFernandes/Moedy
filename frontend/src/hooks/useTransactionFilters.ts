import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { thisMonth } from '@/lib/periods'
import type { TransactionFilters, TransactionType } from '@/types/finance'

export const PAGE_SIZE = 20
/** Valor do filtro de categoria que significa "transações sem categoria". */
export const SEM_CATEGORIA = 'sem'

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
const UUID_REGEX = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i

/**
 * Filtros da página de transações, guardados na URL para sobreviver a um recarregamento
 * e poderem ser compartilhados por link:
 *   ?inicio=2026-09-01&fim=2026-09-30&conta=<id>&categoria=<id|sem>&tipo=DESPESA&busca=uber&pagina=2
 * Sem `inicio`/`fim`, o período é o mês atual; `periodo=tudo` remove o filtro de datas.
 */
export function useTransactionFilters() {
  const [params, setParams] = useSearchParams()

  // Valores inválidos na URL (editada à mão) são ignorados em vez de gerar erro na API
  const values = useMemo(() => {
    const matching = (key: string, regex: RegExp) => {
      const value = params.get(key) ?? ''
      return regex.test(value) ? value : ''
    }

    const semPeriodo = params.get('periodo') === 'tudo'
    const periodoNaUrl = params.has('inicio') || params.has('fim')
    const periodo = semPeriodo
      ? { inicio: '', fim: '' }
      : periodoNaUrl
        ? { inicio: matching('inicio', DATE_REGEX), fim: matching('fim', DATE_REGEX) }
        : thisMonth()

    const categoria = params.get('categoria') === SEM_CATEGORIA ? SEM_CATEGORIA : matching('categoria', UUID_REGEX)
    const tipo = matching('tipo', /^(DESPESA|RECEITA)$/) as TransactionType | ''
    const pagina = Math.max(1, Math.floor(Number(params.get('pagina'))) || 1)

    return {
      ...periodo,
      conta: matching('conta', UUID_REGEX),
      categoria,
      tipo,
      busca: params.get('busca') ?? '',
      pagina,
    }
  }, [params])

  const apiFilters = useMemo<TransactionFilters>(
    () => ({
      dataInicio: values.inicio || undefined,
      dataFim: values.fim || undefined,
      accountId: values.conta || undefined,
      categoryId: values.categoria && values.categoria !== SEM_CATEGORIA ? values.categoria : undefined,
      semCategoria: values.categoria === SEM_CATEGORIA ? true : undefined,
      tipo: values.tipo || undefined,
      busca: values.busca.trim() || undefined,
      page: values.pagina,
      pageSize: PAGE_SIZE,
    }),
    [values],
  )

  /** Altera parâmetros da URL (valor vazio remove). Mudar um filtro volta para a página 1. */
  const update = useCallback(
    (patch: Record<string, string | null>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (!('pagina' in patch)) next.delete('pagina')
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

  const setPeriod = useCallback(
    (inicio: string, fim: string) => {
      // Sem nenhuma data, o período precisa ficar explícito na URL; senão voltaria ao mês atual
      if (!inicio && !fim) update({ periodo: 'tudo', inicio: null, fim: null })
      else update({ periodo: null, inicio: inicio || null, fim: fim || null })
    },
    [update],
  )

  const setPage = useCallback((pagina: number) => update({ pagina: pagina > 1 ? String(pagina) : null }), [update])

  /** Volta ao padrão: mês atual, sem outros filtros. */
  const clear = useCallback(() => setParams({}, { replace: true }), [setParams])

  return { values, apiFilters, update, setPeriod, setPage, clear, hasFilters: params.size > 0 }
}
