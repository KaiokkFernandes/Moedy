import clsx from 'clsx'
import { Pencil, Trash2 } from 'lucide-react'
import { IconButton } from '@/components/ui/Button'
import { formatCurrency, formatDate } from '@/lib/format'
import type { Category, Transaction } from '@/types/finance'
import { CategorySelect } from './CategorySelect'

interface TransactionListProps {
  transactions: Transaction[]
  categories: Category[]
  onEdit: (transaction: Transaction) => void
  onDelete: (transaction: Transaction) => void
}

function Amount({ transaction, className }: { transaction: Transaction; className?: string }) {
  const receita = transaction.tipo === 'RECEITA'
  return (
    <span className={clsx('font-medium whitespace-nowrap tabular-nums', receita ? 'text-emerald-600' : 'text-red-600', className)}>
      {receita ? '+' : '−'} {formatCurrency(transaction.valor)}
    </span>
  )
}

function RowActions({ transaction, onEdit, onDelete }: Omit<TransactionListProps, 'transactions' | 'categories'> & { transaction: Transaction }) {
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
export function TransactionList({ transactions, categories, onEdit, onDelete }: TransactionListProps) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-2xl bg-white ring-1 ring-slate-200 md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs font-medium tracking-wide text-slate-500 uppercase">
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
          <tbody className="divide-y divide-slate-100">
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 whitespace-nowrap text-slate-600 tabular-nums">{formatDate(transaction.data)}</td>
                <td className="max-w-64 truncate px-4 py-2 font-medium text-slate-900" title={transaction.descricao}>
                  {transaction.descricao}
                </td>
                <td className="max-w-48 px-4 py-2">
                  <CategorySelect transaction={transaction} categories={categories} />
                </td>
                <td className="max-w-40 truncate px-4 py-2 text-slate-600">{transaction.account.nome}</td>
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
          <li key={transaction.id} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{transaction.descricao}</p>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {formatDate(transaction.data)} · {transaction.account.nome}
                </p>
              </div>
              <Amount transaction={transaction} />
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <CategorySelect transaction={transaction} categories={categories} />
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
