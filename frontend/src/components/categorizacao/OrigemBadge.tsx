import clsx from 'clsx'
import type { Confianca, OrigemCategoria } from '@/types/import'

const ORIGENS: Record<Exclude<OrigemCategoria, 'MANUAL'>, { label: string; className: string }> = {
  REGRA: { label: 'Regra', className: 'bg-sky-50 text-sky-800' },
  MEMORIA: { label: 'Memória', className: 'bg-violet-50 text-violet-800' },
  IA: { label: 'IA', className: 'bg-indigo-50 text-indigo-800' },
}

interface OrigemBadgeProps {
  origem: OrigemCategoria | null
  confianca?: Confianca | null
}

/**
 * Selo com a origem da categoria. Sugestões da IA com confiança média ganham o aviso "Conferir":
 * a cor nunca vem sozinha, o texto sempre diz de onde veio.
 */
export function OrigemBadge({ origem, confianca = null }: OrigemBadgeProps) {
  if (!origem || origem === 'MANUAL') return null
  const { label, className } = ORIGENS[origem]
  const conferir = origem === 'IA' && confianca === 'MEDIA'

  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap', className)}>
        {origem === 'IA' && confianca ? `${label} · ${confianca === 'ALTA' ? 'confiança alta' : 'confiança média'}` : label}
      </span>
      {conferir && (
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-amber-900">
          Conferir
        </span>
      )}
    </span>
  )
}
