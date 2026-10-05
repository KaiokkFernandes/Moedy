import { useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import { CategoryPillSelect } from '@/components/categories/CategoryPillSelect'
import { FormAlert } from '@/components/FormAlert'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate, pluralize } from '@/lib/format'
import type { Category } from '@/types/finance'
import type { ImportItem, ImportReview as ImportReviewData } from '@/types/import'

interface ImportReviewProps {
  data: ImportReviewData
  categories: Category[]
  loading: boolean
  error: string
  onBack: () => void
  /** Recebe só as transações marcadas, já com as categorias ajustadas. */
  onConfirm: (itens: ImportItem[]) => void
}

function SummaryCard({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={clsx('mt-1 text-2xl font-semibold tabular-nums', className ?? 'text-slate-900')}>{value}</p>
    </div>
  )
}

/** Etapa de revisão: o usuário confere o que foi lido, ajusta categorias e escolhe o que importar. */
export function ImportReview({ data, categories, loading, error, onBack, onConfirm }: ImportReviewProps) {
  const { itens, erros, resumo } = data
  const novas = useMemo(() => itens.filter((item) => !item.duplicada), [itens])

  // Duplicadas começam (e ficam) desmarcadas: a conta já tem essas transações
  const [selected, setSelected] = useState(() => new Set(novas.map((item) => item.externalId)))
  const [categoryById, setCategoryById] = useState<Record<string, string | null>>(() =>
    Object.fromEntries(itens.map((item) => [item.externalId, item.categoryId])),
  )

  const allSelected = selected.size === novas.length && novas.length > 0
  const selectAllRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = selected.size > 0 && !allSelected
  }, [selected, allSelected])

  function toggle(externalId: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(externalId)) next.delete(externalId)
      else next.add(externalId)
      return next
    })
  }

  function handleConfirm() {
    onConfirm(
      novas
        .filter((item) => selected.has(item.externalId))
        .map((item) => ({ ...item, categoryId: categoryById[item.externalId] ?? null })),
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard label="Linhas no arquivo" value={resumo.total} />
        <SummaryCard label="Novas" value={resumo.novas} className="text-emerald-600" />
        <SummaryCard label="Duplicadas" value={resumo.duplicadas} className="text-slate-500" />
        <SummaryCard label="Com erro" value={resumo.comErro} className={resumo.comErro > 0 ? 'text-red-600' : 'text-slate-500'} />
      </div>

      {erros.length > 0 && (
        <details className="rounded-2xl bg-red-50 px-5 py-3 text-sm text-red-800">
          <summary className="cursor-pointer font-medium">
            {pluralize(erros.length, 'linha não pôde ser lida', 'linhas não puderam ser lidas')} e{' '}
            {erros.length === 1 ? 'será ignorada' : 'serão ignoradas'}
          </summary>
          <ul className="mt-2 space-y-1">
            {erros.map((erro) => (
              <li key={erro.linha}>
                Linha {erro.linha}: {erro.motivo}
              </li>
            ))}
          </ul>
        </details>
      )}

      {resumo.novas === 0 && (
        <p role="status" className="rounded-2xl bg-amber-50 px-5 py-3 text-sm text-amber-800">
          {itens.length === 0
            ? 'Nenhuma transação válida foi encontrada neste arquivo.'
            : 'Todas as transações deste arquivo já foram importadas nesta conta. Não há nada novo para importar.'}
        </p>
      )}

      {itens.length > 0 && (
        <section aria-label="Transações encontradas" className="rounded-2xl bg-white ring-1 ring-slate-200">
          <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
            <input
              ref={selectAllRef}
              type="checkbox"
              aria-label="Selecionar todas as novas"
              checked={allSelected}
              disabled={novas.length === 0}
              onChange={() => setSelected(allSelected ? new Set() : new Set(novas.map((item) => item.externalId)))}
              className="size-4 rounded border-slate-300 accent-emerald-600"
            />
            <p className="text-sm font-medium text-slate-900">
              {selected.size} de {pluralize(novas.length, 'nova selecionada', 'novas selecionadas')}
            </p>
          </div>

          <ul className="divide-y divide-slate-100">
            {itens.map((item) => {
              const receita = item.tipo === 'RECEITA'
              return (
                <li
                  key={item.externalId}
                  className={clsx(
                    'grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 px-4 py-2.5 md:grid-cols-[auto_6rem_1fr_12rem_8rem]',
                    item.duplicada && 'bg-slate-50 opacity-50',
                  )}
                >
                  <input
                    type="checkbox"
                    aria-label={`Importar ${item.descricao}`}
                    checked={selected.has(item.externalId)}
                    disabled={item.duplicada}
                    onChange={() => toggle(item.externalId)}
                    className="col-start-1 row-start-1 size-4 rounded border-slate-300 accent-emerald-600"
                  />
                  <span className="hidden text-sm whitespace-nowrap text-slate-600 tabular-nums md:col-start-2 md:row-start-1 md:block">
                    {formatDate(item.data)}
                  </span>
                  <div className="col-start-2 row-start-1 min-w-0 md:col-start-3">
                    <p className="truncate text-sm font-medium text-slate-900" title={item.descricao}>
                      {item.descricao}
                      {item.duplicada && (
                        <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">
                          Duplicada
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500 md:hidden">{formatDate(item.data)}</p>
                  </div>
                  <div className="col-span-2 col-start-2 row-start-2 min-w-0 md:col-span-1 md:col-start-4 md:row-start-1">
                    <CategoryPillSelect
                      label={`Categoria de ${item.descricao}`}
                      value={categoryById[item.externalId] ?? null}
                      onChange={(categoryId) => setCategoryById((prev) => ({ ...prev, [item.externalId]: categoryId }))}
                      options={categories.filter((category) => category.tipo === item.tipo)}
                      disabled={item.duplicada}
                    />
                  </div>
                  <span
                    className={clsx(
                      'col-start-3 row-start-1 text-right text-sm font-medium whitespace-nowrap tabular-nums md:col-start-5',
                      receita ? 'text-emerald-600' : 'text-red-600',
                    )}
                  >
                    {receita ? '+' : '−'} {formatCurrency(item.valor)}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <FormAlert message={error} />

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <Button variant="secondary" onClick={onBack} disabled={loading}>
          Voltar
        </Button>
        <Button onClick={handleConfirm} loading={loading} disabled={selected.size === 0}>
          Importar {pluralize(selected.size, 'transação', 'transações')}
        </Button>
      </div>
    </div>
  )
}
