import type { ReactNode } from 'react'
import { PageTitle } from './PageTitle'

/** Título da página com uma ação à direita (ex.: botão de criar). */
export function PageHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <PageTitle>{title}</PageTitle>
      {action}
    </div>
  )
}
