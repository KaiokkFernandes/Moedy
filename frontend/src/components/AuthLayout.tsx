import type { ReactNode } from 'react'
import { Wallet } from 'lucide-react'

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-page px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl bg-surface p-8 shadow-sm ring-1 ring-line">
          <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-accent-soft-strong text-success">
            <Wallet className="size-6" />
          </div>
          <h1 className="text-2xl font-semibold text-fg">{title}</h1>
          <p className="mt-1 text-sm text-fg-3">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
        <p className="mt-4 text-center text-sm text-fg-2">{footer}</p>
      </div>
    </main>
  )
}
