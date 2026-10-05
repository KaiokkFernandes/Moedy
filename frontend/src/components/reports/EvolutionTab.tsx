import { ChartCard } from '@/components/charts/ChartCard'
import { MonthlyChart } from '@/components/charts/MonthlyChart'
import { useReportMonthly } from '@/hooks/useReports'
import { formatCurrency, formatMonthShort } from '@/lib/format'

/** Aba Evolução: receitas x despesas e a linha do saldo, mês a mês. */
export function EvolutionTab({ accountId }: { accountId?: string }) {
  const monthly = useReportMonthly({ accountId, meses: 12 })

  return (
    <ChartCard
      title="Receitas, despesas e saldo"
      subtitle="Últimos 12 meses (não depende do período escolhido)"
      query={monthly}
      empty={!monthly.data || monthly.data.meses.every((item) => item.receitas === 0 && item.despesas === 0)}
      emptyMessage="Nenhuma movimentação nos últimos 12 meses."
      table={
        monthly.data && {
          columns: ['Mês', 'Receitas', 'Despesas', 'Saldo'],
          rows: monthly.data.meses.map((item) => [
            formatMonthShort(item.mes),
            formatCurrency(item.receitas),
            formatCurrency(item.despesas),
            formatCurrency(item.saldo),
          ]),
        }
      }
    >
      {monthly.data && <MonthlyChart meses={monthly.data.meses} showBalance />}
    </ChartCard>
  )
}
