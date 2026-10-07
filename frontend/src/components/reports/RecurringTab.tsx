import { ChartCard } from '@/components/charts/ChartCard'
import { useReportRecurring } from '@/hooks/useReports'
import { formatCurrency, formatDate, pluralize } from '@/lib/format'

/** Aba Recorrentes: assinaturas e cobranças fixas detectadas, com o custo mensal e anual. */
export function RecurringTab({ accountId }: { accountId?: string }) {
  const recurring = useReportRecurring({ accountId })
  const data = recurring.data

  return (
    <ChartCard
      title="Assinaturas e cobranças fixas"
      subtitle="Cobranças com a mesma descrição e valor parecido em pelo menos 3 meses seguidos, olhando os últimos 12 meses (não depende do período escolhido)"
      query={recurring}
      empty={!data || data.recorrentes.length === 0}
      emptyMessage="Nenhuma cobrança recorrente detectada ainda. É preciso pelo menos 3 meses seguidos de histórico."
    >
      {data && (
        <>
          <dl className="mb-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-page p-4">
              <dt className="text-sm text-fg-3">Total por mês</dt>
              <dd className="mt-1 text-xl font-semibold text-fg">{formatCurrency(data.totalMensal)}</dd>
            </div>
            <div className="rounded-xl bg-page p-4">
              <dt className="text-sm text-fg-3">Custo anual estimado</dt>
              <dd className="mt-1 text-xl font-semibold text-fg">{formatCurrency(data.totalAnual)}</dd>
            </div>
            <div className="rounded-xl bg-page p-4">
              <dt className="text-sm text-fg-3">Cobranças detectadas</dt>
              <dd className="mt-1 text-xl font-semibold text-fg">{data.recorrentes.length}</dd>
            </div>
          </dl>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-fg-3">
                <th scope="col" className="py-2 font-medium">Cobrança</th>
                <th scope="col" className="px-2 py-2 text-right font-medium">Por mês</th>
                <th scope="col" className="py-2 text-right font-medium">Por ano</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.recorrentes.map((item) => (
                <tr key={item.nome}>
                  <td className="py-2">
                    <p className="font-medium text-fg">{item.nome}</p>
                    <p className="text-xs text-fg-3">
                      {pluralize(item.mesesSeguidos, 'mês seguido', 'meses seguidos')} · última em {formatDate(item.ultimaCobranca)}
                    </p>
                  </td>
                  <td className="px-2 py-2 text-right text-fg-2 tabular-nums">{formatCurrency(item.valorMedio)}</td>
                  <td className="py-2 text-right font-medium text-fg tabular-nums">{formatCurrency(item.custoAnual)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </ChartCard>
  )
}
