import clsx from 'clsx'
import type { Confianca, OrigemCategoria } from '@/types/import'

const ORIGENS: Record<Exclude<OrigemCategoria, 'MANUAL'>, { label: string; className: string }> = {
  REGRA: { label: 'Regra', className: 'bg-info-soft text-info-fg' },
  MEMORIA: { label: 'Memória', className: 'bg-memory-soft text-memory-fg' },
  IA: { label: 'IA', className: 'bg-ai-soft text-ai-fg' },
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
        <span className="rounded-full bg-warning-soft-strong px-2 py-0.5 text-xs font-medium whitespace-nowrap text-warning-strong">
          Conferir
        </span>
      )}
    </span>
  )
}
