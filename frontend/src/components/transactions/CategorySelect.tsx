import clsx from 'clsx'
import { ChevronDown } from 'lucide-react'
import { useUpdateTransactionCategory } from '@/hooks/useTransactions'
import type { Category, Transaction } from '@/types/finance'

interface CategorySelectProps {
  transaction: Transaction
  categories: Category[]
}

/** Troca a categoria da transação direto na lista, sem abrir o formulário. */
export function CategorySelect({ transaction, categories }: CategorySelectProps) {
  const updateCategory = useUpdateTransactionCategory()
  // Só categorias do mesmo tipo (despesa/receita) da transação
  const options = categories.filter((category) => category.tipo === transaction.tipo)

  // Enquanto salva, já mostra a categoria escolhida
  const categoryId = updateCategory.isPending ? updateCategory.variables.categoryId : transaction.categoryId
  const cor = options.find((category) => category.id === categoryId)?.cor

  return (
    <div className="relative inline-flex max-w-full items-center">
      <span
        aria-hidden
        className={clsx('pointer-events-none absolute left-2.5 size-2 rounded-full', !cor && 'bg-slate-300')}
        style={cor ? { backgroundColor: cor } : undefined}
      />
      <select
        aria-label={`Categoria de ${transaction.descricao}`}
        value={categoryId ?? ''}
        disabled={updateCategory.isPending}
        onChange={(event) => updateCategory.mutate({ id: transaction.id, categoryId: event.target.value || null })}
        title={updateCategory.isError ? 'Não foi possível trocar a categoria. Tente novamente.' : undefined}
        className={clsx(
          'max-w-full cursor-pointer appearance-none truncate rounded-full border py-1 pr-7 pl-6 text-xs font-medium focus:ring-2 focus:ring-emerald-100 focus:outline-none disabled:cursor-wait disabled:opacity-60',
          updateCategory.isError
            ? 'border-red-400 bg-red-50 text-red-700'
            : categoryId
              ? 'border-transparent bg-slate-100 text-slate-700 hover:border-slate-300'
              : 'border-dashed border-slate-300 bg-white text-slate-500 hover:border-slate-400',
        )}
      >
        <option value="">Sem categoria</option>
        {options.map((category) => (
          <option key={category.id} value={category.id}>
            {category.nome}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute right-2 size-3.5 text-slate-500" />
    </div>
  )
}
