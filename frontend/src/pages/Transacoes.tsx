import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { ArrowLeftRight, Landmark, Plus } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { RuleFormModal, type RuleSavedResult } from '@/components/rules/RuleFormModal'
import { TransactionFilters } from '@/components/transactions/TransactionFilters'
import { TransactionFormModal } from '@/components/transactions/TransactionFormModal'
import { TransactionList } from '@/components/transactions/TransactionList'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Pagination } from '@/components/ui/Pagination'
import { Snackbar, SnackbarAction } from '@/components/ui/Snackbar'
import { EmptyState, ErrorState, Loading } from '@/components/ui/States'
import { useAccounts } from '@/hooks/useAccounts'
import { useCategories } from '@/hooks/useCategories'
import { useCategoryRules } from '@/hooks/useCategoryRules'
import { PAGE_SIZE, useTransactionFilters } from '@/hooks/useTransactionFilters'
import { useDeleteTransaction, useTransactions } from '@/hooks/useTransactions'
import { getErrorMessage } from '@/lib/api'
import { formatCurrency, formatDate, pluralize } from '@/lib/format'
import { normalizeText, suggestKeyword } from '@/lib/text'
import type { Category, Transaction } from '@/types/finance'

/** `null` = modal fechado; `{}` = nova transação; `{ transaction }` = edição. */
type FormState = { transaction?: Transaction } | null

/** Aviso no rodapé depois de trocar uma categoria na linha: primeiro oferece criar a regra, depois mostra o resultado. */
type Notice =
  | { kind: 'oferta'; descricao: string; category: Category }
  | { kind: 'resultado'; message: string }
  | null

function SummaryCard({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={clsx('mt-1 text-xl font-semibold tabular-nums', className)}>{formatCurrency(value)}</p>
    </div>
  )
}

export function Transacoes() {
  const filters = useTransactionFilters()
  const accounts = useAccounts()
  const categories = useCategories()
  const transactions = useTransactions(filters.apiFilters)
  const deleteTransaction = useDeleteTransaction()
  const [form, setForm] = useState<FormState>(null)
  const [deleting, setDeleting] = useState<Transaction | null>(null)
  const rules = useCategoryRules()
  const [notice, setNotice] = useState<Notice>(null)
  const [ruleDefaults, setRuleDefaults] = useState<{ palavraChave: string; categoryId: string } | null>(null)

  function handleCategoryChanged(transaction: Transaction, category: Category) {
    // Se uma regra já leva transações assim para esta categoria, não há o que oferecer
    const descricao = normalizeText(transaction.descricao)
    const covered = rules.data?.some(
      (rule) => rule.categoryId === category.id && descricao.includes(normalizeText(rule.palavraChave)),
    )
    setNotice(covered ? null : { kind: 'oferta', descricao: transaction.descricao, category })
  }

  function handleRuleSaved({ rule, categorizadas }: RuleSavedResult) {
    const aplicadas =
      categorizadas === undefined
        ? ''
        : categorizadas === 0
          ? ' Nenhuma outra transação sem categoria corresponde a ela.'
          : ` ${pluralize(categorizadas, 'transação categorizada', 'transações categorizadas')}.`
    setNotice({ kind: 'resultado', message: `Regra "${rule.palavraChave}" criada.${aplicadas}` })
  }

  // Se a página atual ficou vazia (ex.: excluiu o último item dela), volta para a última que existe
  const { setPage } = filters
  const total = transactions.data?.total
  const pagina = filters.values.pagina
  useEffect(() => {
    if (total === undefined || transactions.isPlaceholderData) return
    const ultima = Math.max(1, Math.ceil(total / PAGE_SIZE))
    if (pagina > ultima) setPage(ultima)
  }, [total, pagina, setPage, transactions.isPlaceholderData])

  function closeDelete() {
    setDeleting(null)
    deleteTransaction.reset()
  }

  async function confirmDelete() {
    if (!deleting) return
    try {
      await deleteTransaction.mutateAsync(deleting.id)
      closeDelete()
    } catch {
      // O erro aparece dentro do diálogo
    }
  }

  if (accounts.isPending || categories.isPending) {
    return (
      <>
        <PageHeader title="Transações" />
        <Loading />
      </>
    )
  }

  if (accounts.isError || categories.isError) {
    return (
      <>
        <PageHeader title="Transações" />
        <ErrorState
          message={getErrorMessage(accounts.error ?? categories.error, 'Não foi possível carregar os dados.')}
          onRetry={() => {
            accounts.refetch()
            categories.refetch()
          }}
        />
      </>
    )
  }

  // Toda transação pertence a uma conta
  if (accounts.data.length === 0) {
    return (
      <>
        <PageHeader title="Transações" />
        <EmptyState
          icon={Landmark}
          title="Cadastre uma conta primeiro"
          description="Toda transação pertence a uma conta. Crie sua primeira conta para começar a lançar."
          action={
            <Link
              to="/contas"
              className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Ir para Contas
            </Link>
          }
        />
      </>
    )
  }

  const newButton = (
    <Button onClick={() => setForm({})}>
      <Plus className="size-4" aria-hidden />
      Nova transação
    </Button>
  )

  const data = transactions.data

  return (
    <>
      <PageHeader title="Transações" action={newButton} />

      <TransactionFilters filters={filters} accounts={accounts.data} categories={categories.data} />

      {transactions.isPending ? (
        <Loading />
      ) : transactions.isError || !data ? (
        <ErrorState
          message={getErrorMessage(transactions.error, 'Não foi possível carregar as transações.')}
          onRetry={transactions.refetch}
        />
      ) : (
        <div
          aria-busy={transactions.isFetching}
          className={clsx('transition-opacity', transactions.isPlaceholderData && 'opacity-60')}
        >
          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            <SummaryCard label="Receitas" value={data.totalReceitas} className="text-emerald-600" />
            <SummaryCard label="Despesas" value={data.totalDespesas} className="text-red-600" />
            <SummaryCard
              label="Saldo do período"
              value={data.totalReceitas - data.totalDespesas}
              className={data.totalReceitas - data.totalDespesas < 0 ? 'text-red-600' : 'text-slate-900'}
            />
          </div>

          {data.total === 0 ? (
            <EmptyState
              icon={ArrowLeftRight}
              title="Nenhuma transação encontrada"
              description="Não há transações para os filtros escolhidos. Mude o período ou os filtros, ou lance uma nova."
              action={newButton}
            />
          ) : (
            <>
              <TransactionList
                transactions={data.itens}
                categories={categories.data}
                onEdit={(transaction) => setForm({ transaction })}
                onDelete={setDeleting}
                onCategoryChanged={handleCategoryChanged}
              />
              <div className="mt-4">
                <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onChange={filters.setPage} />
              </div>
            </>
          )}
        </div>
      )}

      <TransactionFormModal
        open={form !== null}
        transaction={form?.transaction}
        accounts={accounts.data}
        categories={categories.data}
        defaultAccountId={filters.values.conta}
        onClose={() => setForm(null)}
      />

      <RuleFormModal
        open={ruleDefaults !== null}
        categories={categories.data}
        defaults={ruleDefaults ?? undefined}
        offerApply
        onSaved={handleRuleSaved}
        onClose={() => setRuleDefaults(null)}
      />

      {notice && (
        <Snackbar onClose={() => setNotice(null)}>
          {notice.kind === 'oferta' ? (
            <>
              <span>
                Categoria alterada para <strong>{notice.category.nome}</strong>.
              </span>
              <SnackbarAction
                onClick={() => {
                  setRuleDefaults({ palavraChave: suggestKeyword(notice.descricao), categoryId: notice.category.id })
                  setNotice(null)
                }}
              >
                Criar regra para transações parecidas
              </SnackbarAction>
            </>
          ) : (
            <span>{notice.message}</span>
          )}
        </Snackbar>
      )}

      <ConfirmDialog
        open={deleting !== null}
        onClose={closeDelete}
        onConfirm={confirmDelete}
        title="Excluir transação"
        confirmLabel="Excluir transação"
        loading={deleteTransaction.isPending}
        error={
          deleteTransaction.isError
            ? getErrorMessage(deleteTransaction.error, 'Não foi possível excluir a transação.')
            : ''
        }
      >
        {deleting && (
          <p>
            Excluir <strong className="text-slate-900">{deleting.descricao}</strong>, de {formatDate(deleting.data)}, no
            valor de {formatCurrency(deleting.valor)}?
          </p>
        )}
        <p>Essa ação não pode ser desfeita.</p>
      </ConfirmDialog>
    </>
  )
}
