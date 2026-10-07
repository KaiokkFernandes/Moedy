import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatMonthLong } from '@/lib/format'
import { shiftMonth } from '@/lib/periods'
import { IconButton } from './Button'

interface MonthSelectorProps {
  /** Mês selecionado, "AAAA-MM". */
  mes: string
  onChange: (mes: string) => void
  /** Último mês que pode ser escolhido ("AAAA-MM"). */
  max?: string
}

/** Navegação mês a mês: ‹ outubro de 2026 › */
export function MonthSelector({ mes, onChange, max }: MonthSelectorProps) {
  return (
    <div className="flex items-center gap-1 rounded-xl bg-surface p-1 ring-1 ring-line">
      <IconButton label="Mês anterior" onClick={() => onChange(shiftMonth(mes, -1))}>
        <ChevronLeft className="size-4" />
      </IconButton>
      <span aria-live="polite" className="min-w-36 text-center text-sm font-medium text-fg first-letter:uppercase">
        {formatMonthLong(mes)}
      </span>
      <IconButton label="Próximo mês" disabled={max !== undefined && mes >= max} onClick={() => onChange(shiftMonth(mes, 1))}>
        <ChevronRight className="size-4" />
      </IconButton>
    </div>
  )
}
