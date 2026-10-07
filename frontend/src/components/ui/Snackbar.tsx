import type { ReactNode } from 'react'
import { X } from 'lucide-react'

/** Aviso flutuante no rodapé da tela, com espaço para uma ação. Fica até ser fechado. */
export function Snackbar({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-20 flex justify-center px-4">
      <div
        role="status"
        className="pointer-events-auto flex max-w-xl items-center gap-3 rounded-xl bg-inverse py-2.5 pr-2 pl-4 text-sm text-inverse-fg shadow-lg"
      >
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">{children}</div>
        <button
          type="button"
          aria-label="Dispensar"
          onClick={onClose}
          className="shrink-0 rounded-lg p-1.5 text-inverse-fg/70 hover:bg-inverse-fg/10 hover:text-inverse-fg focus-visible:outline-2 focus-visible:outline-inverse-fg"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}

/** Botão de ação dentro do Snackbar. */
export function SnackbarAction({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded font-medium text-inverse-fg underline underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-inverse-fg"
    >
      {children}
    </button>
  )
}
