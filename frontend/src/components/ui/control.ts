import clsx from 'clsx'

/** Classes compartilhadas pelos controles de formulário. */
export function controlClasses(error?: string, className?: string) {
  return clsx(
    'block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500',
    error
      ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
      : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-100',
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
