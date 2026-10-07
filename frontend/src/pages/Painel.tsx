import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CircleAlert, Landmark } from 'lucide-react'
import { BudgetProgress, BudgetStatusPill } from '@/components/budgets/BudgetProgress'
import { CategoryDonut } from '@/components/charts/CategoryDonut'
import { ChartCard } from '@/components/charts/ChartCard'
import { DailyPaceChart } from '@/components/charts/DailyPaceChart'
import { MonthlyChart } from '@/components/charts/MonthlyChart'
import { Variation } from '@/components/charts/Variation'
import { StatCard } from '@/components/dashboard/StatCard'
import { TransactionMiniList } from '@/components/dashboard/TransactionMiniList'
import { PageHeader } from '@/components/PageHeader'
import { MonthSelector } from '@/components/ui/MonthSelector'
import { ErrorState } from '@/components/ui/States'
import { useAccounts } from '@/hooks/useAccounts'
import { useBudgets } from '@/hooks/useBudgets'
import {
  useReportByCategory,
  useReportDaily,
  useReportLargestExpenses,
  useReportMonthly,
  useReportSummary,
} from '@/hooks/useReports'
import { useTransactions } from '@/hooks/useTransactions'
import { getErrorMessage } from '@/lib/api'
import { formatCurrency, formatMonthName, formatMonthShort, formatPercent, pluralize } from '@/lib/format'
import { currentMonth, monthPeriod, shiftMonth } from '@/lib/periods'
import type { CategoryTotal } from '@/types/reports'

const seeAllClass = 'shrink-0 text-sm font-medium text-accent-fg hover:underline'

export function Painel() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()

  // Mês em foco, guardado na URL (?mes=2026-09). Sem o parâmetro (ou com um mês futuro/inválido), é o mês atual.
  const atual = currentMonth()
  const mesParam = params.get('mes') ?? ''
  const mes = /^\d{4}-(0[1-9]|1[0-2])$/.test(mesParam) && mesParam <= atual ? mesParam : atual
  const { inicio, fim } = monthPeriod(mes)
  const range = { dataInicio: inicio, dataFim: fim }
  const mesAnterior = formatMonthName(shiftMonth(mes, -1))

  const setMes = (next: string) => setParams(next === atual ? {} : { mes: next }, { replace: true })

  const accounts = useAccounts()
  const summary = useReportSummary(range)
  const byCategory = useReportByCategory({ ...range, tipo: 'DESPESA' })
  const monthly = useReportMonthly({ dataFim: fim, meses: 6 })
  const daily = useReportDaily({ dataFim: fim })
  const largest = useReportLargestExpenses({ ...range, limite: 5 })
  const latest = useTransactions({ ...range, page: 1, pageSize: 5 })
  const budgets = useBudgets({ ano: Number(mes.slice(0, 4)), mes: Number(mes.slice(5, 7)) })
  // Só a contagem das transações sem categoria, em qualquer período
  const uncategorized = useTransactions({ semCategoria: true, page: 1, pageSize: 1 })

  const periodQuery = `inicio=${inicio}&fim=${fim}`

  function openCategory(categoria: CategoryTotal) {
    navigate(`/transacoes?${periodQuery}&tipo=DESPESA&categoria=${categoria.categoryId ?? 'sem'}`)
  }

  const data = summary.data
  const semCategoria = uncategorized.data?.total ?? 0

  // Ritmo de gastos: quanto já foi gasto até o último dia mostrado, e quanto era no mesmo dia do mês anterior
  const ultimoDia = daily.data?.mesAtual.dias.at(-1)
  const mesmoDiaAnterior = ultimoDia && daily.data?.mesAnterior.dias[ultimoDia.dia - 1]

  return (
    <>
      <PageHeader
        title="Painel"
        action={
          <MonthSelector mes={mes} onChange={setMes} max={atual} />
        }
      />

      {accounts.data?.length === 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl bg-surface p-5 ring-1 ring-line">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft-strong text-success">
            <Landmark className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-fg">Comece cadastrando uma conta</p>
            <p className="text-sm text-fg-3">Depois, lance transações ou importe o extrato do banco para ver seus números aqui.</p>
          </div>
          <Link to="/contas" className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-on-solid hover:bg-accent-hover">
            Ir para Contas
          </Link>
        </div>
      )}

      {semCategoria > 0 && (
        <div role="status" className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl bg-warning-soft px-5 py-3 text-sm text-warning-strong">
          <CircleAlert className="size-4 shrink-0" aria-hidden />
          <span>
            {semCategoria === 1
              ? 'Há 1 transação sem categoria.'
              : `Há ${semCategoria} transações sem categoria.`}{' '}
            Elas aparecem como "Sem categoria" nos gráficos.
          </span>
          <Link to="/transacoes?categoria=sem&periodo=tudo" className="font-medium underline underline-offset-2">
            Categorizar agora
          </Link>
        </div>
      )}

      {summary.isError ? (
        <div className="mb-6">
          <ErrorState message={getErrorMessage(summary.error, 'Não foi possível carregar o resumo do mês.')} onRetry={summary.refetch} />
        </div>
      ) : (
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label={mes === atual ? 'Saldo total das contas' : 'Saldo das contas no fim do mês'}
            value={data?.saldoContas.fim}
            valueClassName={data && data.saldoContas.fim < 0 ? 'text-danger-fg' : undefined}
          >
            {data && <Variation value={data.saldoContas.variacao} label="desde o início do mês" />}
          </StatCard>
          <StatCard label="Despesas do mês" value={data?.despesas}>
            {data && <Variation value={data.variacao.despesas} label={`vs ${mesAnterior}`} upIsGood={false} />}
          </StatCard>
          <StatCard label="Receitas do mês" value={data?.receitas}>
            {data && <Variation value={data.variacao.receitas} label={`vs ${mesAnterior}`} />}
          </StatCard>
          <StatCard label="Saldo do mês" value={data?.saldo} valueClassName={data && data.saldo < 0 ? 'text-danger-fg' : undefined}>
            {data && <Variation value={data.variacao.saldo} label={`vs ${mesAnterior}`} />}
          </StatCard>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Despesas por categoria"
          subtitle="Clique em uma categoria para ver as transações"
          query={byCategory}
          empty={!byCategory.data || byCategory.data.categorias.length === 0}
          emptyMessage="Nenhuma despesa neste mês."
        >
          {byCategory.data && (
            <CategoryDonut
              categorias={byCategory.data.categorias}
              total={byCategory.data.total}
              centerLabel="em despesas"
              onSelect={openCategory}
            />
          )}
        </ChartCard>

        <ChartCard
          title="Receitas x despesas"
          subtitle="Últimos 6 meses"
          query={monthly}
          empty={!monthly.data || monthly.data.meses.every((item) => item.receitas === 0 && item.despesas === 0)}
          emptyMessage="Nenhuma movimentação nos últimos 6 meses."
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
          {monthly.data && <MonthlyChart meses={monthly.data.meses} />}
        </ChartCard>

        <ChartCard
          className="lg:col-span-2"
          title="Ritmo de gastos"
          subtitle={
            ultimoDia && mesmoDiaAnterior
              ? `${formatCurrency(ultimoDia.acumulado)} até o dia ${ultimoDia.dia}; em ${mesAnterior}, eram ${formatCurrency(mesmoDiaAnterior.acumulado)} no mesmo dia`
              : 'Gasto acumulado dia a dia, comparado com o mês anterior'
          }
          query={daily}
          empty={!daily.data || (daily.data.mesAtual.total === 0 && daily.data.mesAnterior.total === 0)}
          emptyMessage="Nenhuma despesa neste mês nem no anterior."
          table={
            daily.data && {
              columns: ['Dia', formatMonthName(daily.data.mesAtual.mes), formatMonthName(daily.data.mesAnterior.mes)],
              rows: daily.data.mesAnterior.dias.map((dia, index) => [
                dia.dia,
                daily.data.mesAtual.dias[index] ? formatCurrency(daily.data.mesAtual.dias[index].acumulado) : '',
                formatCurrency(dia.acumulado),
              ]),
            }
          }
        >
          {daily.data && <DailyPaceChart {...daily.data} />}
        </ChartCard>

        <ChartCard
          className="lg:col-span-2"
          title="Orçamentos do mês"
          subtitle="Os 3 mais perto do limite"
          action={
            <Link to={`/orcamentos${mes === atual ? '' : `?mes=${mes}`}`} className={seeAllClass}>
              Ver orçamentos
            </Link>
          }
          query={budgets}
          empty={!budgets.data || budgets.data.orcamentos.length === 0}
          emptyMessage="Nenhum orçamento neste mês. Defina limites por categoria na página Orçamentos."
        >
          {budgets.data && (
            <ul className="grid gap-x-8 gap-y-4 md:grid-cols-3">
              {/* A API já devolve os orçamentos do mais perto (ou além) do limite para o mais folgado */}
              {budgets.data.orcamentos.slice(0, 3).map((budget) => (
                <li key={budget.id}>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-fg">{budget.categoria.nome}</span>
                    <BudgetStatusPill status={budget.status} />
                  </div>
                  <BudgetProgress
                    percentual={budget.percentual}
                    status={budget.status}
                    label={`Orçamento de ${budget.categoria.nome}`}
                  />
                  <p className="mt-1.5 text-xs text-fg-3">
                    {formatCurrency(budget.gasto)} de {formatCurrency(budget.valorLimite)} ({formatPercent(budget.percentual)})
                  </p>
                </li>
              ))}
            </ul>
          )}
        </ChartCard>

        <ChartCard
          title="Maiores despesas do mês"
          action={
            <Link to={`/transacoes?${periodQuery}&tipo=DESPESA`} className={seeAllClass}>
              Ver todas
            </Link>
          }
          query={largest}
          empty={!largest.data || largest.data.length === 0}
          emptyMessage="Nenhuma despesa neste mês."
        >
          {largest.data && <TransactionMiniList transactions={largest.data} />}
        </ChartCard>

        <ChartCard
          title="Últimas transações"
          subtitle={
            latest.data && latest.data.total > 5 ? `5 de ${pluralize(latest.data.total, 'transação', 'transações')} do mês` : undefined
          }
          action={
            <Link to={`/transacoes?${periodQuery}`} className={seeAllClass}>
              Ver todas
            </Link>
          }
          query={latest}
          empty={!latest.data || latest.data.itens.length === 0}
          emptyMessage="Nenhuma transação neste mês."
        >
          {latest.data && <TransactionMiniList transactions={latest.data.itens} />}
        </ChartCard>
      </div>
    </>
  )
}
