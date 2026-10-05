import type { Category } from '@/types/finance'

/** <option>s de categoria agrupadas em Despesas e Receitas, para selects que aceitam os dois tipos. */
export function GroupedCategoryOptions({ categories }: { categories: Category[] }) {
  const groups = [
    { label: 'Despesas', items: categories.filter((category) => category.tipo === 'DESPESA') },
    { label: 'Receitas', items: categories.filter((category) => category.tipo === 'RECEITA') },
  ]

  return groups.map(
    ({ label, items }) =>
      items.length > 0 && (
        <optgroup key={label} label={label}>
          {items.map((category) => (
            <option key={category.id} value={category.id}>
              {category.nome}
            </option>
          ))}
        </optgroup>
      ),
  )
}
