import type { ReactNode } from 'react'

interface FieldProps {
  id: string
  label: string
  error?: string
  hint?: string
  children: ReactNode
}

/** Rótulo + controle + mensagem de erro (ou dica). Usado por Input, Select e CurrencyInput. */
export function Field({ id, label, error, hint, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-fg-2">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-erro`} className="mt-1 text-sm text-danger-fg">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1 text-xs text-fg-3">{hint}</p>
      )}
    </div>
  )
}
