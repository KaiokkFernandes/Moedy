/** Opções do seletor Despesa / Receita, com a cor de cada tipo quando selecionado. */
export const TRANSACTION_TYPE_OPTIONS = [
  { value: 'DESPESA' as const, label: 'Despesa', activeClassName: 'text-red-600' },
  { value: 'RECEITA' as const, label: 'Receita', activeClassName: 'text-emerald-700' },
]
