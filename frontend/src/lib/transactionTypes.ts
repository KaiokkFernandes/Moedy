/** Opções do seletor Despesa / Receita, com a cor de cada tipo quando selecionado. */
export const TRANSACTION_TYPE_OPTIONS = [
  { value: 'DESPESA' as const, label: 'Despesa', activeClassName: 'text-danger-fg' },
  { value: 'RECEITA' as const, label: 'Receita', activeClassName: 'text-accent-fg' },
]
