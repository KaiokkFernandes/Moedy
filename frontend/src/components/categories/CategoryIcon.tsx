import clsx from 'clsx'
import { useTheme } from '@/hooks/useTheme'
import { corParaTema } from '@/lib/color'
import { CATEGORY_ICONS, FALLBACK_CATEGORY_ICON } from '@/lib/categoryOptions'

interface CategoryIconProps {
  icone: string
  cor: string
  size?: 'sm' | 'md'
}

/** Ícone da categoria em um círculo com a cor dela ao fundo. */
export function CategoryIcon({ icone, cor, size = 'md' }: CategoryIconProps) {
  const { escuro } = useTheme()
  const exibida = corParaTema(cor, escuro)
  const Icon = CATEGORY_ICONS[icone] ?? FALLBACK_CATEGORY_ICON
  return (
    <span
      className={clsx(
        'flex shrink-0 items-center justify-center rounded-full',
        size === 'sm' ? 'size-7' : 'size-10',
      )}
      // Cor da categoria com transparência no fundo e cheia no ícone
      style={{ backgroundColor: `${exibida}26`, color: exibida }}
    >
      <Icon className={size === 'sm' ? 'size-3.5' : 'size-5'} aria-hidden />
    </span>
  )
}
