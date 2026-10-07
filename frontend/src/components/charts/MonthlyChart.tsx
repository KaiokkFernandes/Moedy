import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { axisTick } from '@/lib/chartTheme'
import { useChartColors } from '@/hooks/useChartColors'
import { formatCompactCurrency, formatMonthLong, formatMonthShort } from '@/lib/format'
import type { MonthlyReport } from '@/types/reports'
import { ChartLegend, ChartTooltip } from './ChartTooltip'

interface MonthlyChartProps {
  meses: MonthlyReport['meses']
  /** Acrescenta a linha do saldo (receitas − despesas), na mesma escala das barras. */
  showBalance?: boolean
}

/** Barras de receitas x despesas por mês. */
export function MonthlyChart({ meses, showBalance = false }: MonthlyChartProps) {
  const cores = useChartColors()
  return (
    <>
      <ChartLegend
        items={[
          { label: 'Receitas', color: cores.receita, shape: 'bar' },
          { label: 'Despesas', color: cores.despesa, shape: 'bar' },
          ...(showBalance ? [{ label: 'Saldo', color: cores.saldo, shape: 'line' as const }] : []),
        ]}
      />
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={meses} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barGap={2}>
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
            <Bar dataKey="receitas" name="Receitas" fill={cores.receita} radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} />
            <Bar dataKey="despesas" name="Despesas" fill={cores.despesa} radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} />
            {showBalance && (
              <Line
                dataKey="saldo"
                name="Saldo"
                stroke={cores.saldo}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={{ r: 4, fill: cores.saldo, stroke: cores.fundo, strokeWidth: 2 }}
                isAnimationActive={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </>
  )
}
