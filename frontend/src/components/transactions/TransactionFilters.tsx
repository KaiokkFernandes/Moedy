import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { SEM_CATEGORIA, type useTransactionFilters } from '@/hooks/useTransactionFilters'
import { last90Days, lastMonth, thisMonth, type Period } from '@/lib/periods'
import type { Account, Category } from '@/types/finance'

const SHORTCUTS: { label: string; period: () => Period }[] = [
  { label: 'Este mês', period: thisMonth },
  { label: 'Mês passado', period: lastMonth },
  { label: 'Últimos 90 dias', period: last90Days },
  { label: 'Todo o período', period: () => ({ inicio: '', fim: '' }) },
]

interface TransactionFiltersProps {
  filters: ReturnType<typeof useTransactionFilters>
  accounts: Account[]
  categories: Category[]
}

export function TransactionFilters({ filters, accounts, categories }: TransactionFiltersProps) {
  const { values, update, setPeriod, clear, hasFilters } = filters

  // A busca vai para a URL (e para a API) só depois de uma pausa na digitação
  const [busca, setBusca] = useState(values.busca)
  useEffect(() => {
    if (busca === values.busca) return
    const timeout = setTimeout(() => update({ busca }), 300)
    return () => clearTimeout(timeout)
  }, [busca, values.busca, update])

  const despesas = categories.filter((category) => category.tipo === 'DESPESA')
  const receitas = categories.filter((category) => category.tipo === 'RECEITA')

  return (
    <section aria-label="Filtros" className="mb-6 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {SHORTCUTS.map(({ label, period }) => {
          const { inicio, fim } = period()
          const active = inicio === values.inicio && fim === values.fim
          return (
            <button
              key={label}
              type="button"
              aria-pressed={active}
              onClick={() => setPeriod(inicio, fim)}
              className={clsx(
                'rounded-full px-3 py-1 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400',
                active ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
              )}
            >
              {label}
            </button>
          )
        })}
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={() => {
              setBusca('')
              clear()
            }}
          >
            <X className="size-4" aria-hidden />
            Limpar filtros
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <Input
          label="De"
          type="date"
          value={values.inicio}
          max={values.fim || undefined}
          onChange={(e) => setPeriod(e.target.value, values.fim)}
        />
        <Input
          label="Até"
          type="date"
          value={values.fim}
          min={values.inicio || undefined}
          onChange={(e) => setPeriod(values.inicio, e.target.value)}
        />
        <Select label="Conta" value={values.conta} onChange={(e) => update({ conta: e.target.value })}>
          <option value="">Todas</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.nome}
            </option>
          ))}
        </Select>
        <Select label="Categoria" value={values.categoria} onChange={(e) => update({ categoria: e.target.value })}>
          <option value="">Todas</option>
          <option value={SEM_CATEGORIA}>Sem categoria</option>
          <optgroup label="Despesas">
            {despesas.map((category) => (
              <option key={category.id} value={category.id}>
                {category.nome}
              </option>
            ))}
          </optgroup>
          <optgroup label="Receitas">
            {receitas.map((category) => (
              <option key={category.id} value={category.id}>
                {category.nome}
              </option>
            ))}
          </optgroup>
        </Select>
        <Select label="Tipo" value={values.tipo} onChange={(e) => update({ tipo: e.target.value })}>
          <option value="">Todos</option>
          <option value="DESPESA">Despesas</option>
          <option value="RECEITA">Receitas</option>
        </Select>
        <Input
          label="Buscar"
          type="search"
          placeholder="Descrição…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>
    </section>
  )
}
