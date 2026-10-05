import clsx from 'clsx'

interface SegmentedControlProps<T extends string> {
  label: string
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string; activeClassName?: string }[]
}

/** Escolha entre poucas opções lado a lado (ex.: Despesa / Receita). */
export function SegmentedControl<T extends string>({ label, value, onChange, options }: SegmentedControlProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-1 rounded-lg bg-slate-100 p-1">
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={clsx(
              'rounded-md px-3 py-1.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400',
              active
                ? clsx('bg-white shadow-sm', option.activeClassName ?? 'text-slate-900')
                : 'text-slate-600 hover:text-slate-900',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
