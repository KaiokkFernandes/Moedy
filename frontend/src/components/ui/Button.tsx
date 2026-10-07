import type { ButtonHTMLAttributes } from 'react'
import clsx from 'clsx'
import { LoaderCircle } from 'lucide-react'

const VARIANTS = {
  primary: 'bg-accent text-on-solid hover:bg-accent-hover focus-visible:outline-accent',
  secondary: 'bg-surface text-fg-2 ring-1 ring-line-strong ring-inset hover:bg-page focus-visible:outline-focus',
  danger: 'bg-danger text-on-solid hover:bg-danger-hover focus-visible:outline-danger',
  ghost: 'text-fg-2 hover:bg-subtle hover:text-fg focus-visible:outline-focus',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof VARIANTS
  size?: 'sm' | 'md'
  loading?: boolean
  fullWidth?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  type = 'button',
  disabled,
  className,
  children,
  ...buttonProps
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
        size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2.5 text-sm',
        fullWidth && 'w-full',
        VARIANTS[variant],
        className,
      )}
      {...buttonProps}
    >
      {loading && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Texto lido por leitores de tela e mostrado como dica. */
  label: string
  danger?: boolean
}

export function IconButton({ label, danger, className, children, ...buttonProps }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={clsx(
        'rounded-lg p-2 text-fg-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-50',
        danger ? 'hover:bg-danger-soft hover:text-danger-fg' : 'hover:bg-subtle hover:text-fg',
        className,
      )}
      {...buttonProps}
    >
      {children}
    </button>
  )
}
