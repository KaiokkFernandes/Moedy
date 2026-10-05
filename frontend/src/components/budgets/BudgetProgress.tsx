import clsx from 'clsx'
import { CircleAlert, CircleCheck, TriangleAlert, type LucideIcon } from 'lucide-react'
import { formatPercent } from '@/lib/format'
import type { BudgetStatus } from '@/types/budgets'

/** Aparência de cada situação. A cor nunca vem sozinha: há sempre o rótulo e o ícone. */
const STATUS: Record<BudgetStatus, { label: string; icon: LucideIcon; bar: string; track: string; pill: string }> = {
  OK: { label: 'Dentro do limite', icon: CircleCheck, bar: 'bg-emerald-600', track: 'bg-emerald-100', pill: 'bg-emerald-50 text-emerald-800' },
  ATENCAO: { label: 'Atenção', icon: TriangleAlert, bar: 'bg-amber-500', track: 'bg-amber-100', pill: 'bg-amber-50 text-amber-800' },
  ESTOURADO: { label: 'Estourado', icon: CircleAlert, bar: 'bg-red-600', track: 'bg-red-100', pill: 'bg-red-50 text-red-800' },
}

/** Barra de progresso do orçamento: verde, amarela a partir de 80% e vermelha a partir de 100%. */
export function BudgetProgress({ percentual, status, label }: { percentual: number; status: BudgetStatus; label: string }) {
  const { bar, track } = STATUS[status]
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.min(100, Math.round(percentual))}
      aria-valuetext={`${formatPercent(percentual)} do limite`}
      className={clsx('h-2.5 overflow-hidden rounded-full', track)}
    >
      <div className={clsx('h-full rounded-full', bar)} style={{ width: `${Math.min(100, percentual)}%` }} />
    </div>
  )
}

export function BudgetStatusPill({ status }: { status: BudgetStatus }) {
  const { label, icon: Icon, pill } = STATUS[status]
  return (
    <span className={clsx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap', pill)}>
      <Icon className="size-3.5" aria-hidden />
      {label}
    </span>
  )
}
