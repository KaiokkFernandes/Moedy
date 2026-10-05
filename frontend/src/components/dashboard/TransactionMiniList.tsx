import clsx from 'clsx'
import { CategoryIcon } from '@/components/categories/CategoryIcon'
import { formatCurrency, formatDate } from '@/lib/format'
import type { Transaction } from '@/types/finance'

/** Lista compacta de transações para os blocos do painel. */
export function TransactionMiniList({ transactions }: { transactions: Transaction[] }) {
  return (
    <ul className="divide-y divide-slate-100">
      {transactions.map((transaction) => {
        const receita = transaction.tipo === 'RECEITA'
        return (
          <li key={transaction.id} className="flex items-center gap-3 py-2">
            <CategoryIcon icone={transaction.category?.icone ?? 'tag'} cor={transaction.category?.cor ?? '#94a3b8'} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">{transaction.descricao}</p>
              <p className="truncate text-xs text-slate-500">
                {formatDate(transaction.data)} · {transaction.category?.nome ?? 'Sem categoria'}
              </p>
            </div>
            <span className={clsx('text-sm font-medium whitespace-nowrap tabular-nums', receita ? 'text-emerald-600' : 'text-red-600')}>
              {receita ? '+' : '−'} {formatCurrency(transaction.valor)}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
