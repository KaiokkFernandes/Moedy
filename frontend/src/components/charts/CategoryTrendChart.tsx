import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useTheme } from '@/hooks/useTheme'
import { corParaTema } from '@/lib/color'
import { axisTick } from '@/lib/chartTheme'
import { useChartColors } from '@/hooks/useChartColors'
import { formatCompactCurrency, formatMonthLong, formatMonthShort } from '@/lib/format'
import type { CategoryTrendReport } from '@/types/reports'
import { ChartTooltip } from './ChartTooltip'

/** Total por mês de uma categoria, na cor dela. Série única: o título do bloco já diz o que é. */
export function CategoryTrendChart({ categoria, meses }: CategoryTrendReport) {
  const cores = useChartColors()
  const { escuro } = useTheme()
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={meses} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={cores.grade} />
          <XAxis
            dataKey="mes"
            tickFormatter={formatMonthShort}
            tick={axisTick(cores)}
            tickLine={false}
            axisLine={{ stroke: cores.grade }}
            minTickGap={8}
          />
          <YAxis tickFormatter={formatCompactCurrency} tick={axisTick(cores)} tickLine={false} axisLine={false} width={72} />
          <Tooltip content={<ChartTooltip formatLabel={formatMonthLong} />} cursor={{ fill: cores.cursor }} />
          <Bar dataKey="total" name={categoria.nome} fill={corParaTema(categoria.cor, escuro)} radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
