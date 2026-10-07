import { ChartCard } from '@/components/charts/ChartCard'
import { useReportTopMerchants } from '@/hooks/useReports'
import { useChartColors } from '@/hooks/useChartColors'
import { formatCurrency, formatPercent, pluralize } from '@/lib/format'
import type { ReportParams } from '@/types/reports'

/**
 * Aba Estabelecimentos: ranking dos maiores gastos, com barras horizontais.
 * As barras são HTML (e não um gráfico em SVG) para os nomes longos caberem inteiros e os
 * valores ficarem escritos ao lado de cada barra, inclusive no celular.
 */
export function MerchantsTab({ range }: { range: ReportParams }) {
  const cores = useChartColors()
  const merchants = useReportTopMerchants({ ...range, limite: 15 })
  const items = merchants.data?.estabelecimentos ?? []
  const max = items[0]?.total ?? 0

  return (
    <ChartCard
      title="Onde você mais gastou"
      subtitle="Descrições parecidas (parcelas, códigos no fim) são agrupadas"
      query={merchants}
      empty={items.length === 0}
      emptyMessage="Nenhuma despesa no período."
    >
      <ol className="space-y-3">
        {items.map((item, index) => (
          <li key={item.nome} className="grid grid-cols-[1.5rem_1fr_auto] items-center gap-x-3 gap-y-1">
            <span className="text-sm text-fg-4 tabular-nums">{index + 1}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-fg">{item.nome}</p>
              <p className="text-xs text-fg-3">
                {pluralize(item.quantidade, 'transação', 'transações')} · {formatPercent(item.percentual)} das despesas
              </p>
            </div>
            <span className="text-sm font-medium text-fg tabular-nums">{formatCurrency(item.total)}</span>
            <div className="col-span-2 col-start-2 h-2.5 rounded-r bg-subtle">
              <div
                className="h-full rounded-r"
                style={{ width: `${max === 0 ? 0 : Math.max(1, (item.total / max) * 100)}%`, backgroundColor: cores.despesa }}
              />
            </div>
          </li>
        ))}
      </ol>
    </ChartCard>
  )
}
