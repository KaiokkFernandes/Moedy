import type { ReactNode } from 'react'
import clsx from 'clsx'
import { CircleAlert, LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { getErrorMessage } from '@/lib/api'

/** O que o cartão precisa saber da consulta (compatível com o retorno do useQuery). */
interface QueryState {
  isPending: boolean
  isError: boolean
  error: unknown
  isPlaceholderData: boolean
  refetch: () => unknown
}

export interface ChartTable {
  columns: string[]
  rows: (string | number)[][]
}

interface ChartCardProps {
  title: string
  subtitle?: ReactNode
  /** Ação no canto do cabeçalho (ex.: link "ver todas"). */
  action?: ReactNode
  query: QueryState
  /** Sem dados para mostrar (depois de carregar). */
  empty: boolean
  emptyMessage: string
  /** Os mesmos dados do gráfico em tabela, para quem não enxerga o gráfico ou quer os números exatos. */
  table?: ChartTable
  className?: string
  children: ReactNode
}

/**
 * Moldura de um bloco de relatório, com os estados de carregando, erro e vazio.
 * Ao trocar de filtro, o conteúdo anterior fica esmaecido até o novo chegar (sem piscar).
 */
export function ChartCard({ title, subtitle, action, query, empty, emptyMessage, table, className, children }: ChartCardProps) {
  return (
    <section aria-label={title} className={clsx('flex min-w-0 flex-col rounded-2xl bg-white p-5 ring-1 ring-slate-200', className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-medium text-slate-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </div>

      {query.isPending ? (
        <div role="status" className="flex flex-1 items-center justify-center gap-2 py-12 text-sm text-slate-500">
          <LoaderCircle className="size-5 animate-spin" aria-hidden />
          Carregando…
        </div>
      ) : query.isError ? (
        <div role="alert" className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <CircleAlert className="size-6 text-red-600" aria-hidden />
          <p className="mt-2 text-sm text-red-700">{getErrorMessage(query.error, 'Não foi possível carregar este bloco.')}</p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={() => query.refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : empty ? (
        <p className="flex flex-1 items-center justify-center py-12 text-center text-sm text-slate-500">{emptyMessage}</p>
      ) : (
        <div aria-busy={query.isPlaceholderData} className={clsx('transition-opacity', query.isPlaceholderData && 'opacity-60')}>
          {children}
          {table && (
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer text-slate-500 hover:text-slate-700">Ver dados em tabela</summary>
              <div className="mt-2 max-h-64 overflow-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs text-slate-500">
                      {table.columns.map((column, index) => (
                        <th key={column} scope="col" className={clsx('py-1.5 font-medium', index > 0 && 'text-right')}>
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {table.rows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, index) => (
                          <td key={index} className={clsx('py-1.5 text-slate-700', index > 0 && 'text-right tabular-nums')}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}
        </div>
      )}
    </section>
  )
}
