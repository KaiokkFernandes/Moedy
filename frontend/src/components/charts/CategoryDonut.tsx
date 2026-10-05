import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { CHART_COLORS } from '@/lib/chartTheme'
import { formatCurrency, formatPercent } from '@/lib/format'
import type { CategoryTotal } from '@/types/reports'
import { ChartTooltip } from './ChartTooltip'

/** Uma rosca só se lê bem com poucas fatias: as maiores ficam, o resto vira "Outras". */
const MAX_SLICES = 6

interface Slice {
  key: string
  nome: string
  cor: string
  total: number
  percentual: number
  /** A categoria da fatia; a fatia "Outras" não tem. */
  categoria?: CategoryTotal
}

function buildSlices(categorias: CategoryTotal[], total: number): Slice[] {
  const toSlice = (categoria: CategoryTotal): Slice => ({
    key: categoria.categoryId ?? 'sem',
    nome: categoria.nome,
    cor: categoria.cor,
    total: categoria.total,
    percentual: categoria.percentual,
    categoria,
  })

  if (categorias.length <= MAX_SLICES) return categorias.map(toSlice)

  const resto = categorias.slice(MAX_SLICES - 1)
  const totalResto = resto.reduce((sum, categoria) => sum + categoria.total, 0)
  return [
    ...categorias.slice(0, MAX_SLICES - 1).map(toSlice),
    {
      key: 'outras',
      nome: `Outras (${resto.length})`,
      cor: CHART_COLORS.outras,
      total: totalResto,
      percentual: total === 0 ? 0 : Math.round((totalResto / total) * 1000) / 10,
    },
  ]
}

interface CategoryDonutProps {
  /** Já ordenadas da maior para a menor, com as cores vindas do banco. */
  categorias: CategoryTotal[]
  total: number
  /** Texto sob o total no centro (ex.: "em despesas"). */
  centerLabel: string
  /** Clique em uma fatia ou no item da legenda. Sem isso, a rosca não é clicável. */
  onSelect?: (categoria: CategoryTotal) => void
}

/** Rosca de totais por categoria, com legenda (nome, percentual e valor) ao lado. */
export function CategoryDonut({ categorias, total, centerLabel, onSelect }: CategoryDonutProps) {
  const slices = buildSlices(categorias, total)

  return (
    // Lado a lado só quando o cartão é largo o bastante para a legenda não cortar os nomes
    <div className="flex flex-col items-center gap-6 sm:flex-row lg:flex-col 2xl:flex-row">
      <div className="relative size-48 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="total"
              nameKey="nome"
              innerRadius="68%"
              outerRadius="100%"
              // Espaço na cor do fundo separa as fatias, em vez de uma borda
              paddingAngle={slices.length > 1 ? 1.5 : 0}
              stroke="none"
              startAngle={90}
              endAngle={-270}
              isAnimationActive={false}
              onClick={(_, index) => {
                const categoria = slices[index]?.categoria
                if (categoria) onSelect?.(categoria)
              }}
            >
              {slices.map((slice) => (
                <Cell
                  key={slice.key}
                  fill={slice.cor}
                  className={onSelect && slice.categoria ? 'cursor-pointer outline-none hover:opacity-80' : 'outline-none'}
                />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-base font-semibold text-slate-900">{formatCurrency(total)}</span>
          <span className="text-xs text-slate-500">{centerLabel}</span>
        </div>
      </div>

      <ul className="w-full min-w-0 flex-1 space-y-1 text-sm">
        {slices.map((slice) => {
          const content = (
            <>
              <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: slice.cor }} />
              <span className="min-w-0 flex-1 truncate text-left text-slate-700">{slice.nome}</span>
              <span className="text-slate-500 tabular-nums">{formatPercent(slice.percentual)}</span>
              <span className="w-24 text-right font-medium text-slate-900 tabular-nums">{formatCurrency(slice.total)}</span>
            </>
          )
          return (
            <li key={slice.key}>
              {onSelect && slice.categoria ? (
                <button
                  type="button"
                  onClick={() => onSelect(slice.categoria!)}
                  title={`Ver transações de ${slice.nome}`}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-slate-400"
                >
                  {content}
                </button>
              ) : (
                <div className="flex items-center gap-2 px-2 py-1">{content}</div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
