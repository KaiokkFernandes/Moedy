import clsx from 'clsx'
import { ChevronDown } from 'lucide-react'
import type { Category } from '@/types/finance'

interface CategoryPillSelectProps {
  /** Texto lido por leitores de tela (ex.: "Categoria de Uber"). */
  label: string
  value: string | null
  onChange: (categoryId: string | null) => void
  /** Categorias que podem ser escolhidas (já filtradas pelo tipo da transação). */
  options: Category[]
  disabled?: boolean
  /** Mensagem de erro, mostrada como dica e com destaque em vermelho. */
  error?: string
}

/** Select compacto de categoria, em formato de etiqueta com a cor da categoria. Usado em linhas de tabela. */
export function CategoryPillSelect({ label, value, onChange, options, disabled, error }: CategoryPillSelectProps) {
  const cor = options.find((category) => category.id === value)?.cor

  return (
    <div className="relative inline-flex max-w-full items-center">
      <span
        aria-hidden
        className={clsx('pointer-events-none absolute left-2.5 size-2 rounded-full', !cor && 'bg-slate-300')}
        style={cor ? { backgroundColor: cor } : undefined}
      />
      <select
        aria-label={label}
        value={value ?? ''}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value || null)}
        title={error}
        className={clsx(
          'max-w-full cursor-pointer appearance-none truncate rounded-full border py-1 pr-7 pl-6 text-xs font-medium focus:ring-2 focus:ring-emerald-100 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60',
          error
            ? 'border-red-400 bg-red-50 text-red-700'
            : value
              ? 'border-transparent bg-slate-100 text-slate-700 hover:border-slate-300'
              : 'border-dashed border-slate-300 bg-white text-slate-500 hover:border-slate-400',
        )}
      >
        <option value="">Sem categoria</option>
        {options.map((category) => (
          <option key={category.id} value={category.id}>
            {category.nome}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute right-2 size-3.5 text-slate-500" />
    </div>
  )
}
