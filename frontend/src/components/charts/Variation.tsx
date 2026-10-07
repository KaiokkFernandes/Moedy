import clsx from 'clsx'
import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import { formatPercent } from '@/lib/format'

interface VariationProps {
  /** Variação percentual; `null` quando não há período anterior para comparar. */
  value: number | null
  /** Com o que se compara (ex.: "vs setembro"). */
  label: string
  /** Para despesas, subir é ruim: a cor se inverte. */
  upIsGood?: boolean
}

/** Variação vs período anterior: seta + percentual. A cor diz se a mudança é boa ou ruim. */
export function Variation({ value, label, upIsGood = true }: VariationProps) {
  if (value === null) {
    return <p className="mt-1 text-xs text-fg-3">Sem dados para comparar</p>
  }

  const Icon = value > 0 ? ArrowUp : value < 0 ? ArrowDown : Minus
  const good = value === 0 ? null : value > 0 === upIsGood

  return (
    <p className="mt-1 flex flex-wrap items-center gap-x-1 text-xs text-fg-3">
      <span
        className={clsx(
          'inline-flex items-center gap-0.5 font-medium',
          good === null ? 'text-fg-2' : good ? 'text-accent-fg' : 'text-danger-strong',
        )}
      >
        <Icon className="size-3.5" aria-hidden />
        <span className="sr-only">{value > 0 ? 'aumento de' : value < 0 ? 'queda de' : 'sem variação:'}</span>
        {formatPercent(Math.abs(value))}
      </span>
      {label}
    </p>
  )
}
