import { useState } from 'react'
import clsx from 'clsx'
import { Landmark, Pencil, Plus, Trash2 } from 'lucide-react'
import { AccountFormModal } from '@/components/accounts/AccountFormModal'
import { PageHeader } from '@/components/PageHeader'
import { Button, IconButton } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState, ErrorState, Loading } from '@/components/ui/States'
import { useAccounts, useDeleteAccount } from '@/hooks/useAccounts'
import { ACCOUNT_TYPES } from '@/lib/accountTypes'
import { getErrorMessage } from '@/lib/api'
import { formatCurrency, pluralize } from '@/lib/format'
import type { Account } from '@/types/finance'

/** `null` = modal fechado; `{}` = nova conta; `{ account }` = edição. */
type FormState = { account?: Account } | null

export function Contas() {
  const accounts = useAccounts()
  const deleteAccount = useDeleteAccount()
  const [form, setForm] = useState<FormState>(null)
  const [deleting, setDeleting] = useState<Account | null>(null)

  const newButton = (
    <Button onClick={() => setForm({})}>
      <Plus className="size-4" aria-hidden />
      Nova conta
    </Button>
  )

  function closeDelete() {
    setDeleting(null)
    deleteAccount.reset()
  }

  async function confirmDelete() {
    if (!deleting) return
    try {
      await deleteAccount.mutateAsync({ id: deleting.id, confirm: deleting.totalTransacoes > 0 })
      closeDelete()
    } catch {
      // O erro aparece dentro do diálogo
    }
  }

  const saldoTotal = accounts.data?.reduce((total, account) => total + account.saldoAtual, 0) ?? 0

  return (
    <>
      <PageHeader title="Contas" action={newButton} />

      {accounts.isPending ? (
        <Loading />
      ) : accounts.isError ? (
        <ErrorState message={getErrorMessage(accounts.error, 'Não foi possível carregar as contas.')} onRetry={accounts.refetch} />
      ) : accounts.data.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="Nenhuma conta cadastrada"
          description="Cadastre sua conta corrente, cartão ou carteira para começar a lançar transações."
          action={newButton}
        />
      ) : (
        <>
          <div className="mb-6 rounded-2xl bg-surface p-5 ring-1 ring-line">
            <p className="text-sm text-fg-3">Saldo total</p>
            <p className={clsx('mt-1 text-3xl font-semibold', saldoTotal < 0 ? 'text-danger-fg' : 'text-fg')}>
              {formatCurrency(saldoTotal)}
            </p>
            <p className="mt-1 text-xs text-fg-3">Soma de {pluralize(accounts.data.length, 'conta', 'contas')}</p>
          </div>

          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {accounts.data.map((account) => {
              const { label, icon: Icon } = ACCOUNT_TYPES[account.tipo]
              return (
                <li key={account.id} className="rounded-2xl bg-surface p-5 ring-1 ring-line">
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft-strong text-success">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate font-medium text-fg">{account.nome}</h2>
                      <p className="text-sm text-fg-3">{label}</p>
                    </div>
                    <div className="-m-2 flex">
                      <IconButton label={`Editar ${account.nome}`} onClick={() => setForm({ account })}>
                        <Pencil className="size-4" />
                      </IconButton>
                      <IconButton label={`Excluir ${account.nome}`} danger onClick={() => setDeleting(account)}>
                        <Trash2 className="size-4" />
                      </IconButton>
                    </div>
                  </div>
                  <p className="mt-4 text-xs text-fg-3">Saldo atual</p>
                  <p
                    className={clsx(
                      'text-2xl font-semibold',
                      account.saldoAtual < 0 ? 'text-danger-fg' : 'text-fg',
                    )}
                  >
                    {formatCurrency(account.saldoAtual)}
                  </p>
                  <p className="mt-1 text-xs text-fg-3">
                    {account.totalTransacoes === 0
                      ? 'Nenhuma transação'
                      : pluralize(account.totalTransacoes, 'transação', 'transações')}
                  </p>
                </li>
              )
            })}
          </ul>
        </>
      )}

      <AccountFormModal open={form !== null} account={form?.account} onClose={() => setForm(null)} />

      <ConfirmDialog
        open={deleting !== null}
        onClose={closeDelete}
        onConfirm={confirmDelete}
        title="Excluir conta"
        confirmLabel={
          deleting && deleting.totalTransacoes > 0
            ? `Excluir conta e ${pluralize(deleting.totalTransacoes, 'transação', 'transações')}`
            : 'Excluir conta'
        }
        loading={deleteAccount.isPending}
        error={deleteAccount.isError ? getErrorMessage(deleteAccount.error, 'Não foi possível excluir a conta.') : ''}
      >
        <p>
          Excluir a conta <strong className="text-fg">{deleting?.nome}</strong>?
        </p>
        {deleting && deleting.totalTransacoes > 0 && (
          <p className="rounded-lg bg-warning-soft px-3 py-2 text-warning-strong">
            Esta conta tem <strong>{pluralize(deleting.totalTransacoes, 'transação', 'transações')}</strong>, que{' '}
            {deleting.totalTransacoes === 1 ? 'será apagada' : 'serão apagadas'} junto com ela.
          </p>
        )}
        <p>Essa ação não pode ser desfeita.</p>
      </ConfirmDialog>
    </>
  )
}
