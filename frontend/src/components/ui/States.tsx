import type { ReactNode } from 'react'
import { CircleAlert, LoaderCircle, type LucideIcon } from 'lucide-react'
import { Button } from './Button'

export function Loading({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
      <LoaderCircle className="size-5 animate-spin" aria-hidden />
      {label}
    </div>
  )
}

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  /** Ação principal, normalmente um botão para criar o primeiro item. */
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
        <Icon className="size-6" />
      </div>
      <h2 className="mt-4 text-base font-semibold text-slate-900">{title}</h2>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center rounded-2xl bg-red-50 px-6 py-10 text-center">
      <CircleAlert className="size-6 text-red-600" aria-hidden />
      <p className="mt-2 text-sm text-red-700">{message}</p>
      <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
        Tentar novamente
      </Button>
    </div>
  )
}
