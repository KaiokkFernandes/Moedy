import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AXIS_TICK, CHART_COLORS } from '@/lib/chartTheme'
import { formatCompactCurrency, formatMonthLong, formatMonthShort } from '@/lib/format'
import type { CategoryTrendReport } from '@/types/reports'
import { ChartTooltip } from './ChartTooltip'

/** Total por mês de uma categoria, na cor dela. Série única: o título do bloco já diz o que é. */
export function CategoryTrendChart({ categoria, meses }: CategoryTrendReport) {
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={meses} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={CHART_COLORS.grade} />
          <XAxis
            dataKey="mes"
            tickFormatter={formatMonthShort}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={{ stroke: CHART_COLORS.grade }}
            minTickGap={8}
          />
          <YAxis tickFormatter={formatCompactCurrency} tick={AXIS_TICK} tickLine={false} axisLine={false} width={72} />
          <Tooltip content={<ChartTooltip formatLabel={formatMonthLong} />} cursor={{ fill: '#f1f5f9' }} />
          <Bar dataKey="total" name={categoria.nome} fill={categoria.cor} radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
