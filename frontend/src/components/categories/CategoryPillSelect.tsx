import clsx from 'clsx'
import { useTheme } from '@/hooks/useTheme'
import { corParaTema } from '@/lib/color'
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
  const { escuro } = useTheme()
  const corSalva = options.find((category) => category.id === value)?.cor
  const cor = corSalva ? corParaTema(corSalva, escuro) : undefined

  return (
    <div className="relative inline-flex max-w-full items-center">
      <span
        aria-hidden
        className={clsx('pointer-events-none absolute left-2.5 size-2 rounded-full', !cor && 'bg-line-strong')}
        style={cor ? { backgroundColor: cor } : undefined}
      />
      <select
        aria-label={label}
        value={value ?? ''}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value || null)}
        title={error}
        className={clsx(
          'max-w-full cursor-pointer appearance-none truncate rounded-full border py-1 pr-7 pl-6 text-xs font-medium focus:ring-2 focus:ring-accent-soft-strong focus:outline-none disabled:cursor-not-allowed disabled:opacity-60',
          error
            ? 'border-danger bg-danger-soft text-danger-strong'
            : value
              ? 'border-transparent bg-subtle text-fg-2 hover:border-line-strong'
              : 'border-dashed border-line-strong bg-surface text-fg-3 hover:border-line-strong',
        )}
      >
        <option value="">Sem categoria</option>
        {options.map((category) => (
          <option key={category.id} value={category.id}>
            {category.nome}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute right-2 size-3.5 text-fg-3" />
    </div>
  )
}
