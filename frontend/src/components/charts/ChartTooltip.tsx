import { formatCurrency } from '@/lib/format'

interface TooltipEntry {
  name?: string | number
  value?: number | string | (number | string)[]
  color?: string
  dataKey?: string | number | ((entry: never) => unknown)
}

interface ChartTooltipProps {
  active?: boolean
  payload?: readonly TooltipEntry[]
  label?: string | number
  /** Formata o rótulo do eixo X (ex.: "2026-10" → "outubro de 2026"). */
  formatLabel?: (label: string) => string
}

/** Tooltip dos gráficos: o valor em BRL em destaque, com um traço da cor da série ao lado do nome. */
export function ChartTooltip({ active, payload, label, formatLabel }: ChartTooltipProps) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg bg-white px-3 py-2 text-sm shadow-lg ring-1 ring-slate-200">
      {label !== undefined && label !== '' && (
        <p className="mb-1 text-xs text-slate-500">{formatLabel ? formatLabel(String(label)) : label}</p>
      )}
      <ul className="space-y-0.5">
        {payload.map((entry, index) => (
          <li key={index} className="flex items-center gap-2">
            <span aria-hidden className="h-0.5 w-3 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-600">{entry.name}</span>
            <strong className="ml-auto pl-3 font-semibold text-slate-900 tabular-nums">
              {formatCurrency(Number(entry.value ?? 0))}
            </strong>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Legenda das séries: uma amostra da cor (barra ou linha, como a marca do gráfico) e o nome em tinta normal. */
export function ChartLegend({ items }: { items: { label: string; color: string; shape: 'bar' | 'line' }[] }) {
  return (
    <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className={item.shape === 'bar' ? 'size-2.5 rounded-sm' : 'h-0.5 w-4 rounded-full'}
            style={{ backgroundColor: item.color }}
          />
          {item.label}
        </li>
      ))}
    </ul>
  )
}
