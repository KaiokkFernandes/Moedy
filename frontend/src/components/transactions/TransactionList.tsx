import clsx from 'clsx'
import { EyeOff, Pencil, Trash2 } from 'lucide-react'
import { IconButton } from '@/components/ui/Button'
import { formatCurrency, formatDate } from '@/lib/format'
import type { Category, Transaction } from '@/types/finance'
import { CategorySelect } from './CategorySelect'

interface TransactionListProps {
  transactions: Transaction[]
  categories: Category[]
  onEdit: (transaction: Transaction) => void
  onDelete: (transaction: Transaction) => void
  /** Chamado quando a categoria é trocada na linha (para oferecer a criação de uma regra). */
  onCategoryChanged?: (transaction: Transaction, category: Category) => void
}

/** Marca transferências e pagamentos de fatura, que não entram nos totais nem nos relatórios. */
function IgnoredBadge() {
  return (
    <span
      title="Não conta nos totais nem nos relatórios (transferência ou pagamento de fatura)"
      className="inline-flex shrink-0 items-center gap-1 rounded-full bg-subtle px-2 py-0.5 text-xs font-medium whitespace-nowrap text-fg-2"
    >
      <EyeOff className="size-3" aria-hidden />
      Fora dos relatórios
    </span>
  )
}

function Amount({ transaction, className }: { transaction: Transaction; className?: string }) {
  const receita = transaction.tipo === 'RECEITA'
  return (
    <span className={clsx('font-medium whitespace-nowrap tabular-nums', receita ? 'text-success' : 'text-danger-fg', className)}>
      {receita ? '+' : '−'} {formatCurrency(transaction.valor)}
    </span>
  )
}

function RowActions({
  transaction,
  onEdit,
  onDelete,
}: Pick<TransactionListProps, 'onEdit' | 'onDelete'> & { transaction: Transaction }) {
  return (
    <div className="flex justify-end">
      <IconButton label={`Editar ${transaction.descricao}`} onClick={() => onEdit(transaction)}>
        <Pencil className="size-4" />
      </IconButton>
      <IconButton label={`Excluir ${transaction.descricao}`} danger onClick={() => onDelete(transaction)}>
        <Trash2 className="size-4" />
      </IconButton>
    </div>
  )
}

/** Tabela no desktop; lista de cards no celular. */
export function TransactionList({
  transactions,
  categories,
  onEdit,
  onDelete,
  onCategoryChanged,
}: TransactionListProps) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-2xl bg-surface ring-1 ring-line md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs font-medium tracking-wide text-fg-3 uppercase">
              <th scope="col" className="px-4 py-3">Data</th>
              <th scope="col" className="px-4 py-3">Descrição</th>
              <th scope="col" className="px-4 py-3">Categoria</th>
              <th scope="col" className="px-4 py-3">Conta</th>
              <th scope="col" className="px-4 py-3 text-right">Valor</th>
              <th scope="col" className="px-4 py-3">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-page">
                <td className="px-4 py-2 whitespace-nowrap text-fg-2 tabular-nums">{formatDate(transaction.data)}</td>
                <td className="max-w-72 px-4 py-2">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium text-fg" title={transaction.descricao}>
                      {transaction.descricao}
                    </span>
                    {transaction.ignorarNosRelatorios && <IgnoredBadge />}
                  </div>
                </td>
                <td className="max-w-48 px-4 py-2">
                  <CategorySelect
                    transaction={transaction}
                    categories={categories}
                    onCategoryChanged={onCategoryChanged}
                  />
                </td>
                <td className="max-w-40 truncate px-4 py-2 text-fg-2">{transaction.account.nome}</td>
                <td className="px-4 py-2 text-right">
                  <Amount transaction={transaction} />
                </td>
                <td className="px-2 py-1">
                  <RowActions transaction={transaction} onEdit={onEdit} onDelete={onDelete} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 md:hidden">
        {transactions.map((transaction) => (
          <li key={transaction.id} className="rounded-2xl bg-surface p-4 ring-1 ring-line">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-fg">{transaction.descricao}</p>
                {transaction.ignorarNosRelatorios && <IgnoredBadge />}
                <p className="mt-0.5 truncate text-xs text-fg-3">
                  {formatDate(transaction.data)} · {transaction.account.nome}
                </p>
              </div>
              <Amount transaction={transaction} />
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <CategorySelect
                    transaction={transaction}
                    categories={categories}
                    onCategoryChanged={onCategoryChanged}
                  />
              </div>
              <div className="-m-2">
                <RowActions transaction={transaction} onEdit={onEdit} onDelete={onDelete} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
