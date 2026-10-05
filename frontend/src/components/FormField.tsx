import { useId, type InputHTMLAttributes } from 'react'
import clsx from 'clsx'

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export function FormField({ label, error, className, ...inputProps }: FormFieldProps) {
  const id = useId()
  const errorId = `${id}-erro`

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={clsx(
          'block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:outline-none',
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
            : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-100',
          className,
        )}
        {...inputProps}
      />
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
