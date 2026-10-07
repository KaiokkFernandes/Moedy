import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import clsx from 'clsx'
import { Copy, Plus, Target, WandSparkles } from 'lucide-react'
import { BudgetCard } from '@/components/budgets/BudgetCard'
import { BudgetFormModal } from '@/components/budgets/BudgetFormModal'
import { BudgetProgress } from '@/components/budgets/BudgetProgress'
import { CategoryIcon } from '@/components/categories/CategoryIcon'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { MonthSelector } from '@/components/ui/MonthSelector'
import { EmptyState, ErrorState, Loading } from '@/components/ui/States'
import {
  useBudgets,
  useBudgetSuggestions,
  useCopyBudgets,
  useCreateBudgetsFromSuggestions,
  useDeleteBudget,
} from '@/hooks/useBudgets'
import { getErrorMessage } from '@/lib/api'
import { statusOfPercent } from '@/lib/budgetStatus'
import { formatCurrency, formatMonthLong, formatMonthName, formatPercent, pluralize } from '@/lib/format'
import { currentMonth, monthPeriod, shiftMonth } from '@/lib/periods'
import type { Budget } from '@/types/budgets'

/** `null` = modal fechado; `{}` = novo; `{ categoryId }` = novo com categoria escolhida; `{ budget }` = edição. */
type FormState = { budget?: Budget; categoryId?: string } | null

/** Dá para planejar até um ano à frente. */
const MAX_MONTHS_AHEAD = 12

export function Orcamentos() {
  const [params, setParams] = useSearchParams()

  // Mês em foco, na URL (?mes=2026-11). Sem o parâmetro (ou inválido), é o mês atual.
  const atual = currentMonth()
  const ultimo = shiftMonth(atual, MAX_MONTHS_AHEAD)
  const mesParam = params.get('mes') ?? ''
  const mes = /^\d{4}-(0[1-9]|1[0-2])$/.test(mesParam) && mesParam <= ultimo ? mesParam : atual
  const setMes = (next: string) => setParams(next === atual ? {} : { mes: next }, { replace: true })

  const month = { ano: Number(mes.slice(0, 4)), mes: Number(mes.slice(5, 7)) }
  const anterior = shiftMonth(mes, -1)
  const previousMonth = { ano: Number(anterior.slice(0, 4)), mes: Number(anterior.slice(5, 7)) }
  const { inicio, fim } = monthPeriod(mes)

  const budgets = useBudgets(month)
  const suggestions = useBudgetSuggestions(month)
  const deleteBudget = useDeleteBudget()
  const copyBudgets = useCopyBudgets()
  const fromSuggestions = useCreateBudgetsFromSuggestions()
  const [form, setForm] = useState<FormState>(null)
  const [deleting, setDeleting] = useState<Budget | null>(null)
  /** Resultado (ou erro) da última ação em lote: copiar do mês anterior ou criar pelas sugestões. */
  const [notice, setNotice] = useState<{ message: string; error?: boolean } | null>(null)

  function changeMonth(next: string) {
    setNotice(null)
    setMes(next)
  }

  async function copyFromPrevious() {
    setNotice(null)
    try {
      const { copiados, ignorados } = await copyBudgets.mutateAsync({ from: previousMonth, to: month })
      const copiadosTexto =
        copiados === 0
          ? 'Nenhum orçamento novo para copiar'
          : `${pluralize(copiados, 'orçamento copiado', 'orçamentos copiados')} de ${formatMonthName(anterior)}`
      const ignoradosTexto =
        ignorados === 0
          ? ''
          : ignorados === 1
            ? '; 1 já existia neste mês e não foi alterado'
            : `; ${ignorados} já existiam neste mês e não foram alterados`
      setNotice({ message: `${copiadosTexto}${ignoradosTexto}.` })
    } catch (error) {
      setNotice({ message: getErrorMessage(error, 'Não foi possível copiar os orçamentos.'), error: true })
    }
  }

  async function createFromSuggestions() {
    setNotice(null)
    try {
      const { criados } = await fromSuggestions.mutateAsync(month)
      setNotice({
        message:
          criados === 0
            ? 'Não há gastos nos últimos 3 meses para sugerir orçamentos.'
            : `${pluralize(criados, 'orçamento criado', 'orçamentos criados')} a partir da média dos últimos 3 meses. Ajuste os limites como preferir.`,
      })
    } catch (error) {
      setNotice({ message: getErrorMessage(error, 'Não foi possível criar os orçamentos.'), error: true })
    }
  }

  function closeDelete() {
    setDeleting(null)
    deleteBudget.reset()
  }

  async function confirmDelete() {
    if (!deleting) return
    try {
      await deleteBudget.mutateAsync(deleting.id)
      closeDelete()
    } catch {
      // O erro aparece dentro do diálogo
    }
  }

  const header = <PageHeader title="Orçamentos" action={<MonthSelector mes={mes} onChange={changeMonth} max={ultimo} />} />

  if (budgets.isPending || suggestions.isPending) {
    return (
      <>
        {header}
        <Loading />
      </>
    )
  }

  if (budgets.isError || suggestions.isError) {
    return (
      <>
        {header}
        <ErrorState
          message={getErrorMessage(budgets.error ?? suggestions.error, 'Não foi possível carregar os orçamentos.')}
          onRetry={() => {
            budgets.refetch()
            suggestions.refetch()
          }}
        />
      </>
    )
  }

  const { resumo, orcamentos, semOrcamento } = budgets.data
  const temSugestoes = suggestions.data.some((item) => item.sugestao && !item.temOrcamento)
  const transactionsHref = (categoryId: string | null) =>
    `/transacoes?inicio=${inicio}&fim=${fim}&tipo=DESPESA&categoria=${categoryId ?? 'sem'}`

  const newButton = (
    <Button onClick={() => setForm({})}>
      <Plus className="size-4" aria-hidden />
      Novo orçamento
    </Button>
  )
  const copyButton = (
    <Button variant="secondary" onClick={copyFromPrevious} loading={copyBudgets.isPending}>
      {!copyBudgets.isPending && <Copy className="size-4" aria-hidden />}
      Copiar do mês anterior
    </Button>
  )

  return (
    <>
      {header}

      {notice && (
        <p
          role={notice.error ? 'alert' : 'status'}
          className={clsx('mb-4 rounded-lg px-4 py-2.5 text-sm', notice.error ? 'bg-danger-soft text-danger-strong' : 'bg-accent-soft text-success-strong')}
        >
          {notice.message}
        </p>
      )}

      {orcamentos.length === 0 ? (
        <EmptyState
          icon={Target}
          title={`Nenhum orçamento em ${formatMonthLong(mes)}`}
          description="Defina um limite de gastos por categoria e acompanhe ao longo do mês quanto já foi usado."
          action={
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
              {temSugestoes && (
                <Button onClick={createFromSuggestions} loading={fromSuggestions.isPending}>
                  {!fromSuggestions.isPending && <WandSparkles className="size-4" aria-hidden />}
                  Criar orçamentos a partir das sugestões
                </Button>
              )}
              {copyButton}
              <Button variant={temSugestoes ? 'secondary' : 'primary'} onClick={() => setForm({})}>
                <Plus className="size-4" aria-hidden />
                Novo orçamento
              </Button>
            </div>
          }
        />
      ) : (
        <>
          <section aria-label="Resumo do mês" className="mb-6 rounded-2xl bg-surface p-5 ring-1 ring-line">
            <dl className="grid grid-cols-3 gap-3">
              <div>
                <dt className="text-sm text-fg-3">Total orçado</dt>
                <dd className="mt-1 text-lg font-semibold text-fg sm:text-2xl">{formatCurrency(resumo.totalOrcado)}</dd>
              </div>
              <div>
                <dt className="text-sm text-fg-3">Total gasto</dt>
                <dd className="mt-1 text-lg font-semibold text-fg sm:text-2xl">{formatCurrency(resumo.totalGasto)}</dd>
              </div>
              <div>
                <dt className="text-sm text-fg-3">{resumo.restante >= 0 ? 'Restante' : 'Acima do orçado'}</dt>
                <dd className={clsx('mt-1 text-lg font-semibold sm:text-2xl', resumo.restante < 0 ? 'text-danger-fg' : 'text-fg')}>
                  {formatCurrency(Math.abs(resumo.restante))}
                </dd>
              </div>
            </dl>
            <div className="mt-4">
              <BudgetProgress percentual={resumo.percentual} status={statusOfPercent(resumo.percentual)} label="Total gasto do total orçado" />
            </div>
            <p className="mt-2 text-sm text-fg-2">
              {formatPercent(resumo.percentual)} do total orçado em {pluralize(orcamentos.length, 'categoria', 'categorias')}
              {resumo.gastoSemOrcamento > 0 && ` · ${formatCurrency(resumo.gastoSemOrcamento)} gastos em categorias sem orçamento`}
            </p>
          </section>

          <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
            {copyButton}
            {newButton}
          </div>

          <ul aria-label="Orçamentos" className={clsx('grid gap-4 sm:grid-cols-2 xl:grid-cols-3', budgets.isPlaceholderData && 'opacity-60')}>
            {orcamentos.map((budget) => (
              <BudgetCard
                key={budget.id}
                budget={budget}
                transactionsHref={transactionsHref(budget.categoryId)}
                onEdit={(item) => setForm({ budget: item })}
                onDelete={setDeleting}
              />
            ))}
          </ul>
        </>
      )}

      {semOrcamento.length > 0 && (
        <section aria-label="Categorias sem orçamento" className="mt-6 rounded-2xl bg-surface ring-1 ring-line">
          <div className="border-b border-line px-5 py-3">
            <h2 className="font-medium text-fg">Categorias sem orçamento</h2>
            <p className="text-sm text-fg-3">Tiveram gasto em {formatMonthLong(mes)}, mas não têm limite definido.</p>
          </div>
          <ul className="divide-y divide-line">
            {semOrcamento.map((item) => (
              <li key={item.categoryId ?? 'sem'} className="flex items-center gap-3 px-5 py-2.5">
                <CategoryIcon icone={item.icone} cor={item.cor} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg">{item.nome}</span>
                <span className="text-sm text-fg-2 tabular-nums">{formatCurrency(item.gasto)}</span>
                {item.categoryId ? (
                  <Button variant="secondary" size="sm" onClick={() => setForm({ categoryId: item.categoryId! })}>
                    <Plus className="size-4" aria-hidden />
                    <span>
                      Criar<span className="sr-only sm:not-sr-only"> orçamento</span>
                      <span className="sr-only"> de {item.nome}</span>
                    </span>
                  </Button>
                ) : (
                  // Transações sem categoria não podem ter orçamento: primeiro precisam ser categorizadas
                  <Link to={transactionsHref(null)} className="text-sm font-medium text-accent-fg hover:underline">
                    Categorizar
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <BudgetFormModal
        open={form !== null}
        onClose={() => setForm(null)}
        mes={month.mes}
        ano={month.ano}
        suggestions={suggestions.data}
        budget={form?.budget}
        defaultCategoryId={form?.categoryId}
      />

      <ConfirmDialog
        open={deleting !== null}
        onClose={closeDelete}
        onConfirm={confirmDelete}
        title="Excluir orçamento"
        confirmLabel="Excluir orçamento"
        loading={deleteBudget.isPending}
        error={deleteBudget.isError ? getErrorMessage(deleteBudget.error, 'Não foi possível excluir o orçamento.') : ''}
      >
        <p>
          Excluir o orçamento de <strong className="text-fg">{deleting?.categoria.nome}</strong> em {formatMonthLong(mes)}?
        </p>
        <p>As transações da categoria não são alteradas.</p>
      </ConfirmDialog>
    </>
  )
}
