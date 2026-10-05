import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AXIS_TICK, CHART_COLORS } from '@/lib/chartTheme'
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
  return (
    <>
      <ChartLegend
        items={[
          { label: 'Receitas', color: CHART_COLORS.receitas, shape: 'bar' },
          { label: 'Despesas', color: CHART_COLORS.despesas, shape: 'bar' },
          ...(showBalance ? [{ label: 'Saldo', color: CHART_COLORS.saldo, shape: 'line' as const }] : []),
        ]}
      />
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={meses} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barGap={2}>
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
            <Bar dataKey="receitas" name="Receitas" fill={CHART_COLORS.receitas} radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} />
            <Bar dataKey="despesas" name="Despesas" fill={CHART_COLORS.despesas} radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} />
            {showBalance && (
              <Line
                dataKey="saldo"
                name="Saldo"
                stroke={CHART_COLORS.saldo}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={{ r: 4, fill: CHART_COLORS.saldo, stroke: '#fff', strokeWidth: 2 }}
                isAnimationActive={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </>
  )
}
