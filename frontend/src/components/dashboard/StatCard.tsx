import type { ReactNode } from 'react'
import clsx from 'clsx'
import { formatCurrency } from '@/lib/format'

interface StatCardProps {
  label: string
  /** Valor em centavos; `undefined` enquanto carrega. */
  value: number | undefined
  /** Classe de cor do valor (o padrão é a tinta normal). */
  valueClassName?: string
  /** Linha de apoio sob o valor (ex.: a variação vs mês anterior). */
  children?: ReactNode
}

/** Cartão com um número de destaque do painel. */
export function StatCard({ label, value, valueClassName, children }: StatCardProps) {
  return (
    <div className="rounded-2xl bg-surface p-4 ring-1 ring-line">
      <p className="text-sm text-fg-3">{label}</p>
      {value === undefined ? (
        <div role="status" aria-label="Carregando" className="mt-2 h-7 w-28 animate-pulse rounded bg-subtle" />
      ) : (
        <>
          <p className={clsx('mt-1 text-xl font-semibold sm:text-2xl', valueClassName ?? 'text-fg')}>
            {formatCurrency(value)}
          </p>
          {children}
        </>
      )}
    </div>
  )
}
