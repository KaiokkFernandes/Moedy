import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { X } from 'lucide-react'
import { CategoryIcon } from '@/components/categories/CategoryIcon'
import { CategoryDonut } from '@/components/charts/CategoryDonut'
import { CategoryTrendChart } from '@/components/charts/CategoryTrendChart'
import { ChartCard } from '@/components/charts/ChartCard'
import { IconButton } from '@/components/ui/Button'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { SEM_CATEGORIA, type useReportFilters } from '@/hooks/useReportFilters'
import { useReportByCategory, useReportCategoryTrend } from '@/hooks/useReports'
import { formatCurrency, formatMonthShort, formatPercent } from '@/lib/format'
import { TRANSACTION_TYPE_OPTIONS } from '@/lib/transactionTypes'

const TYPE_OPTIONS = TRANSACTION_TYPE_OPTIONS.map((option) => ({ ...option, label: `${option.label}s` }))

/** Aba Categorias: rosca + tabela; escolher uma categoria mostra a evolução mensal dela. */
export function CategoriesTab({ filters }: { filters: ReturnType<typeof useReportFilters> }) {
  const { values, range, update } = filters
  const { tipo, categoria } = values
  const tipoLabel = tipo === 'DESPESA' ? 'despesas' : 'receitas'

  const byCategory = useReportByCategory({ ...range, tipo })
  const trend = useReportCategoryTrend(
    {
      accountId: range.accountId,
      tipo,
      meses: 12,
      ...(categoria === SEM_CATEGORIA ? { semCategoria: true } : { categoryId: categoria }),
    },
    categoria !== '',
  )

  const select = (categoryId: string | null) => {
    const key = categoryId ?? SEM_CATEGORIA
    update({ categoria: key === categoria ? null : key })
  }

  const categorias = byCategory.data?.categorias ?? []
  const empty = categorias.length === 0

  return (
    <div className="space-y-6">
      <div className="max-w-xs">
        <SegmentedControl
          label="Tipo"
          value={tipo}
          // Uma categoria é de um tipo só: ao trocar o tipo, a seleção deixa de valer
          onChange={(next) => update({ tipo: next === 'DESPESA' ? null : next, categoria: null })}
          options={TYPE_OPTIONS}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard
          title={tipo === 'DESPESA' ? 'Despesas por categoria' : 'Receitas por categoria'}
          query={byCategory}
          empty={empty}
          emptyMessage={`Nenhuma ${tipo === 'DESPESA' ? 'despesa' : 'receita'} no período.`}
        >
          {byCategory.data && (
            <CategoryDonut
              categorias={categorias}
              total={byCategory.data.total}
              centerLabel={`em ${tipoLabel}`}
              onSelect={(item) => select(item.categoryId)}
            />
          )}
        </ChartCard>

        <ChartCard
          title="Todas as categorias"
          subtitle="Clique em uma categoria para ver a evolução mensal"
          query={byCategory}
          empty={empty}
          emptyMessage="Nada para listar no período."
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs font-medium text-fg-3">
                <th scope="col" className="py-2 font-medium">Categoria</th>
                <th scope="col" className="hidden px-2 py-2 text-right font-medium sm:table-cell">Transações</th>
                <th scope="col" className="px-2 py-2 text-right font-medium">%</th>
                <th scope="col" className="py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {categorias.map((item) => {
                const selected = (item.categoryId ?? SEM_CATEGORIA) === categoria
                return (
                  <tr key={item.categoryId ?? SEM_CATEGORIA} className={clsx(selected ? 'bg-accent-soft' : 'hover:bg-page')}>
                    <td className="py-1.5">
                      <button
                        type="button"
                        aria-pressed={selected}
                        onClick={() => select(item.categoryId)}
                        className="flex w-full items-center gap-2 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-focus"
                      >
                        <CategoryIcon icone={item.icone} cor={item.cor} size="sm" />
                        <span className="truncate font-medium text-fg">{item.nome}</span>
                      </button>
                    </td>
                    <td className="hidden px-2 py-1.5 text-right text-fg-2 tabular-nums sm:table-cell">{item.quantidade}</td>
                    <td className="px-2 py-1.5 text-right text-fg-2 tabular-nums">{formatPercent(item.percentual)}</td>
                    <td className="py-1.5 text-right font-medium text-fg tabular-nums">{formatCurrency(item.total)}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-line font-medium text-fg">
                <td className="py-2">Total</td>
                <td className="hidden px-2 py-2 text-right tabular-nums sm:table-cell">
                  {categorias.reduce((sum, item) => sum + item.quantidade, 0)}
                </td>
                <td className="px-2 py-2" />
                <td className="py-2 text-right tabular-nums">{formatCurrency(byCategory.data?.total ?? 0)}</td>
              </tr>
            </tfoot>
          </table>
        </ChartCard>
      </div>

      {categoria !== '' && (
        <ChartCard
          title={trend.data ? `Evolução de ${trend.data.categoria.nome}` : 'Evolução da categoria'}
          subtitle="Total por mês nos últimos 12 meses (não depende do período escolhido)"
          action={
            <IconButton label="Fechar evolução" onClick={() => update({ categoria: null })} className="-m-2">
              <X className="size-4" />
            </IconButton>
          }
          query={trend}
          empty={!trend.data || trend.data.meses.every((item) => item.total === 0)}
          emptyMessage="Esta categoria não teve movimentação nos últimos 12 meses."
          table={
            trend.data && {
              columns: ['Mês', 'Transações', 'Total'],
              rows: trend.data.meses.map((item) => [formatMonthShort(item.mes), item.quantidade, formatCurrency(item.total)]),
            }
          }
        >
          {trend.data && <CategoryTrendChart {...trend.data} />}
          <Link
            to={`/transacoes?inicio=${values.inicio}&fim=${values.fim}&tipo=${tipo}&categoria=${categoria}${values.conta ? `&conta=${values.conta}` : ''}`}
            className="mt-3 inline-block text-sm font-medium text-accent-fg hover:underline"
          >
            Ver as transações desta categoria no período
          </Link>
        </ChartCard>
      )}
    </div>
  )
}
