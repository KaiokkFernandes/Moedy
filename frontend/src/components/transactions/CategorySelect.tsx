import { CategoryPillSelect } from '@/components/categories/CategoryPillSelect'
import { useUpdateTransactionCategory } from '@/hooks/useTransactions'
import type { Category, Transaction } from '@/types/finance'

interface CategorySelectProps {
  transaction: Transaction
  categories: Category[]
  /** Chamado depois que a troca para uma categoria (não para "sem categoria") é salva. */
  onCategoryChanged?: (transaction: Transaction, category: Category) => void
}

/** Troca a categoria da transação direto na lista, sem abrir o formulário. */
export function CategorySelect({ transaction, categories, onCategoryChanged }: CategorySelectProps) {
  const updateCategory = useUpdateTransactionCategory()
  // Só categorias do mesmo tipo (despesa/receita) da transação
  const options = categories.filter((category) => category.tipo === transaction.tipo)

  async function handleChange(categoryId: string | null) {
    try {
      // mutateAsync (e não os callbacks do mutate) porque a linha pode sair da lista assim que a
      // categoria muda (ex.: no filtro "Sem categoria"), e callbacks de um componente desmontado não rodam
      await updateCategory.mutateAsync({ id: transaction.id, categoryId })
      const category = options.find((option) => option.id === categoryId)
      if (category) onCategoryChanged?.(transaction, category)
    } catch {
      // O erro fica indicado no próprio select
    }
  }

  return (
    <CategoryPillSelect
      label={`Categoria de ${transaction.descricao}`}
      // Enquanto salva, já mostra a categoria escolhida
      value={updateCategory.isPending ? updateCategory.variables.categoryId : transaction.categoryId}
      onChange={handleChange}
      options={options}
      disabled={updateCategory.isPending}
      error={updateCategory.isError ? 'Não foi possível trocar a categoria. Tente novamente.' : undefined}
    />
  )
}
