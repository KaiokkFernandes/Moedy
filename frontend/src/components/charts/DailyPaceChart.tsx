import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { axisTick } from '@/lib/chartTheme'
import { useChartColors } from '@/hooks/useChartColors'
import { formatCompactCurrency, formatMonthName } from '@/lib/format'
import type { DailyReport } from '@/types/reports'
import { ChartLegend, ChartTooltip } from './ChartTooltip'

/** Gasto acumulado dia a dia: o mês em foco em destaque e o anterior, apagado, como referência. */
export function DailyPaceChart({ mesAtual, mesAnterior }: DailyReport) {
  const cores = useChartColors()
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
          { label: atual, color: cores.despesa, shape: 'line' },
          { label: anterior, color: cores.contexto, shape: 'line' },
        ]}
      />
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke={cores.grade} />
            <XAxis dataKey="dia" tick={axisTick(cores)} tickLine={false} axisLine={{ stroke: cores.grade }} minTickGap={16} />
            <YAxis tickFormatter={formatCompactCurrency} tick={axisTick(cores)} tickLine={false} axisLine={false} width={72} />
            <Tooltip content={<ChartTooltip formatLabel={(dia) => `Dia ${dia}`} />} cursor={{ stroke: cores.eixo, strokeWidth: 1 }} />
            <Line dataKey="anterior" name={anterior} stroke={cores.contexto} {...line} />
            <Line
              dataKey="atual"
              name={atual}
              stroke={cores.despesa}
              {...line}
              activeDot={{ r: 5, stroke: cores.fundo, strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  )
}
