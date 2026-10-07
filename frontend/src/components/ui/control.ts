import clsx from 'clsx'

/** Classes compartilhadas pelos controles de formulário. */
export function controlClasses(error?: string, className?: string) {
  return clsx(
    'block w-full rounded-lg border bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-4 focus:ring-2 focus:outline-none disabled:bg-page disabled:text-fg-3',
    error
      ? 'border-danger focus:border-danger focus:ring-danger-ring'
      : 'border-line-strong focus:border-accent focus:ring-accent-soft-strong',
    className,
  )
}

export function controlAria(id: string, error?: string) {
  return {
    id,
    'aria-invalid': error ? (true as const) : undefined,
    'aria-describedby': error ? `${id}-erro` : undefined,
  }
}
