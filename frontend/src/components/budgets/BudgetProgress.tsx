import clsx from 'clsx'
import { CircleAlert, CircleCheck, TriangleAlert, type LucideIcon } from 'lucide-react'
import { formatPercent } from '@/lib/format'
import type { BudgetStatus } from '@/types/budgets'

/** Aparência de cada situação. A cor nunca vem sozinha: há sempre o rótulo e o ícone. */
const STATUS: Record<BudgetStatus, { label: string; icon: LucideIcon; bar: string; track: string; pill: string }> = {
  OK: { label: 'Dentro do limite', icon: CircleCheck, bar: 'bg-accent', track: 'bg-accent-soft-strong', pill: 'bg-accent-soft text-success-strong' },
  ATENCAO: { label: 'Atenção', icon: TriangleAlert, bar: 'bg-warning-bar', track: 'bg-warning-soft-strong', pill: 'bg-warning-soft text-warning-strong' },
  ESTOURADO: { label: 'Estourado', icon: CircleAlert, bar: 'bg-danger', track: 'bg-danger-soft-strong', pill: 'bg-danger-soft text-danger-strong' },
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
