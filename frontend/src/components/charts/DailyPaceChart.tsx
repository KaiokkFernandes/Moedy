import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AXIS_TICK, CHART_COLORS } from '@/lib/chartTheme'
import { formatCompactCurrency, formatMonthName } from '@/lib/format'
import type { DailyReport } from '@/types/reports'
import { ChartLegend, ChartTooltip } from './ChartTooltip'

/** Gasto acumulado dia a dia: o mês em foco em destaque e o anterior, apagado, como referência. */
export function DailyPaceChart({ mesAtual, mesAnterior }: DailyReport) {
  const dias = Math.max(mesAtual.dias.length, mesAnterior.dias.length)
  const data = Array.from({ length: dias }, (_, index) => ({
    dia: index + 1,
    // Sem valor depois do último dia de cada mês, a linha simplesmente termina
    atual: mesAtual.dias[index]?.acumulado,
    anterior: mesAnterior.dias[index]?.acumulado,
  }))

  const atual = formatMonthName(mesAtual.mes)
  const anterior = formatMonthName(mesAnterior.mes)
  const line = { strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', dot: false, isAnimationActive: false } as const

  return (
    <>
      <ChartLegend
        items={[
          { label: atual, color: CHART_COLORS.despesas, shape: 'line' },
          { label: anterior, color: CHART_COLORS.contexto, shape: 'line' },
        ]}
      />
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke={CHART_COLORS.grade} />
            <XAxis dataKey="dia" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: CHART_COLORS.grade }} minTickGap={16} />
            <YAxis tickFormatter={formatCompactCurrency} tick={AXIS_TICK} tickLine={false} axisLine={false} width={72} />
            <Tooltip content={<ChartTooltip formatLabel={(dia) => `Dia ${dia}`} />} cursor={{ stroke: CHART_COLORS.eixo, strokeWidth: 1 }} />
            <Line dataKey="anterior" name={anterior} stroke={CHART_COLORS.contexto} {...line} />
            <Line
              dataKey="atual"
              name={atual}
              stroke={CHART_COLORS.despesas}
              {...line}
              activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  )
}
