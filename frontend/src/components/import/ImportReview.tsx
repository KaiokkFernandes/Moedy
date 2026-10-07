import { useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import { EyeOff } from 'lucide-react'
import { CategoryPillSelect } from '@/components/categories/CategoryPillSelect'
import { OrigemBadge } from '@/components/categorizacao/OrigemBadge'
import { FormAlert } from '@/components/FormAlert'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate, pluralize } from '@/lib/format'
import type { Category } from '@/types/finance'
import type { ImportItem, ImportReview as ImportReviewData, OrigemCategoria } from '@/types/import'

interface ImportReviewProps {
  data: ImportReviewData
  categories: Category[]
  loading: boolean
  error: string
  onBack: () => void
  /** Recebe só as transações marcadas, já com as categorias e origens ajustadas. */
  onConfirm: (itens: ImportItem[]) => void
}

type Filtro = 'todas' | 'ia' | 'sem'

const FILTROS: { id: Filtro; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'ia', label: 'Sugeridas por IA' },
  { id: 'sem', label: 'Sem categoria' },
]

function SummaryCard({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div className="rounded-2xl bg-surface p-4 ring-1 ring-line">
      <p className="text-sm text-fg-3">{label}</p>
      <p className={clsx('mt-1 text-2xl font-semibold tabular-nums', className ?? 'text-fg')}>{value}</p>
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
  // Origem atual de cada categoria. Quando o usuário troca a categoria, a origem vira "MANUAL".
  const [origemById, setOrigemById] = useState<Record<string, OrigemCategoria | null>>(() =>
    Object.fromEntries(itens.map((item) => [item.externalId, item.origemCategoria])),
  )
  const [filtro, setFiltro] = useState<Filtro>('todas')

  // Começa com a sugestão da API (pagamento de fatura, transferência entre contas)
  const [ignored, setIgnored] = useState(
    () => new Set(itens.filter((item) => item.ignorarNosRelatorios).map((item) => item.externalId)),
  )

  // Contagem por origem acompanha as edições do usuário (não só a leitura original)
  const contagem = useMemo(() => {
    const counts = { REGRA: 0, MEMORIA: 0, IA: 0, sem: 0 }
    for (const item of novas) {
      const origem = origemById[item.externalId]
      if (categoryById[item.externalId] && origem && origem !== 'MANUAL') counts[origem] += 1
      if (!categoryById[item.externalId]) counts.sem += 1
    }
    return counts
  }, [novas, origemById, categoryById])

  const visiveis = useMemo(() => {
    if (filtro === 'todas') return itens
    if (filtro === 'ia') return itens.filter((item) => !item.duplicada && origemById[item.externalId] === 'IA')
    return itens.filter((item) => !item.duplicada && !categoryById[item.externalId])
  }, [itens, filtro, origemById, categoryById])

  const allSelected = selected.size === novas.length && novas.length > 0
  const selectAllRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = selected.size > 0 && !allSelected
  }, [selected, allSelected])

  function toggleIgnored(externalId: string) {
    setIgnored((prev) => {
      const next = new Set(prev)
      if (next.has(externalId)) next.delete(externalId)
      else next.add(externalId)
      return next
    })
  }

  function toggle(externalId: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(externalId)) next.delete(externalId)
      else next.add(externalId)
      return next
    })
  }

  function changeCategory(externalId: string, categoryId: string | null) {
    setCategoryById((prev) => ({ ...prev, [externalId]: categoryId }))
    // Escolha feita à mão na revisão: não é mais sugestão da regra, da memória nem da IA
    setOrigemById((prev) => ({ ...prev, [externalId]: categoryId ? 'MANUAL' : null }))
  }

  function handleConfirm() {
    onConfirm(
      novas
        .filter((item) => selected.has(item.externalId))
        .map((item) => ({
          ...item,
          categoryId: categoryById[item.externalId] ?? null,
          origemCategoria: categoryById[item.externalId] ? (origemById[item.externalId] ?? 'MANUAL') : null,
          ignorarNosRelatorios: ignored.has(item.externalId),
        })),
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard label="Linhas no arquivo" value={resumo.total} />
        <SummaryCard label="Novas" value={resumo.novas} className="text-success" />
        <SummaryCard label="Duplicadas" value={resumo.duplicadas} className="text-fg-3" />
        <SummaryCard label="Com erro" value={resumo.comErro} className={resumo.comErro > 0 ? 'text-danger-fg' : 'text-fg-3'} />
      </div>

      {novas.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-surface px-5 py-3 text-sm text-fg-2 ring-1 ring-line">
          <span>
            Categorizadas por regra: <strong className="text-fg">{contagem.REGRA}</strong>
          </span>
          <span>
            por memória: <strong className="text-fg">{contagem.MEMORIA}</strong>
          </span>
          <span>
            por IA: <strong className="text-fg">{contagem.IA}</strong>
          </span>
          <span className={clsx(contagem.sem > 0 && 'font-medium text-warning-strong')}>
            sem categoria: <strong>{contagem.sem}</strong>
          </span>
        </div>
      )}

      {erros.length > 0 && (
        <details className="rounded-2xl bg-danger-soft px-5 py-3 text-sm text-danger-strong">
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
        <p role="status" className="rounded-2xl bg-warning-soft px-5 py-3 text-sm text-warning-strong">
          {itens.length === 0
            ? 'Nenhuma transação válida foi encontrada neste arquivo.'
            : 'Todas as transações deste arquivo já foram importadas nesta conta. Não há nada novo para importar.'}
        </p>
      )}

      {itens.length > 0 && (
        <section aria-label="Transações encontradas" className="rounded-2xl bg-surface ring-1 ring-line">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
            <div className="flex items-center gap-3">
              <input
                ref={selectAllRef}
                type="checkbox"
                aria-label="Selecionar todas as novas"
                checked={allSelected}
                disabled={novas.length === 0}
                onChange={() => setSelected(allSelected ? new Set() : new Set(novas.map((item) => item.externalId)))}
                className="size-4 rounded border-line-strong accent-accent"
              />
              <p className="text-sm font-medium text-fg">
                {selected.size} de {pluralize(novas.length, 'nova selecionada', 'novas selecionadas')}
              </p>
            </div>
            <div role="group" aria-label="Filtrar transações" className="flex flex-wrap gap-1">
              {FILTROS.map((opcao) => (
                <button
                  key={opcao.id}
                  type="button"
                  aria-pressed={filtro === opcao.id}
                  onClick={() => setFiltro(opcao.id)}
                  className={clsx(
                    'rounded-full px-3 py-1 text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
                    filtro === opcao.id ? 'bg-inverse text-inverse-fg' : 'bg-subtle text-fg-2 hover:bg-line',
                  )}
                >
                  {opcao.label}
                </button>
              ))}
            </div>
          </div>

          {visiveis.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-fg-3">Nenhuma transação neste filtro.</p>
          ) : (
            <ul className="divide-y divide-line">
              {visiveis.map((item) => {
                const receita = item.tipo === 'RECEITA'
                const origem = origemById[item.externalId] ?? null
                return (
                  <li
                    key={item.externalId}
                    className={clsx(
                      'grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 px-4 py-2.5 md:grid-cols-[auto_6rem_1fr_12rem_auto_8rem]',
                      item.duplicada && 'bg-page opacity-50',
                    )}
                  >
                    <input
                      type="checkbox"
                      aria-label={`Importar ${item.descricao}`}
                      checked={selected.has(item.externalId)}
                      disabled={item.duplicada}
                      onChange={() => toggle(item.externalId)}
                      className="col-start-1 row-start-1 size-4 rounded border-line-strong accent-accent"
                    />
                    <span className="hidden text-sm whitespace-nowrap text-fg-2 tabular-nums md:col-start-2 md:row-start-1 md:block">
                      {formatDate(item.data)}
                    </span>
                    <div className="col-start-2 row-start-1 min-w-0 md:col-start-3">
                      <p className="truncate text-sm font-medium text-fg" title={item.descricao}>
                        {item.descricao}
                        {item.duplicada && (
                          <span className="ml-2 rounded-full bg-line px-2 py-0.5 text-xs font-medium text-fg-2">
                            Duplicada
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-fg-3">
                        <span className="md:hidden">{formatDate(item.data)}</span>
                        {ignored.has(item.externalId) && (
                          <span className="font-medium text-fg-2">
                            <span className="md:hidden"> · </span>Fora dos relatórios
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="col-start-2 row-start-2 min-w-0 md:col-start-4 md:row-start-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <CategoryPillSelect
                          label={`Categoria de ${item.descricao}`}
                          value={categoryById[item.externalId] ?? null}
                          onChange={(categoryId) => changeCategory(item.externalId, categoryId)}
                          options={categories.filter((category) => category.tipo === item.tipo)}
                          disabled={item.duplicada}
                        />
                        {!item.duplicada && categoryById[item.externalId] && (
                          <OrigemBadge origem={origem} confianca={origem === 'IA' ? item.confianca : null} />
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-pressed={ignored.has(item.externalId)}
                      aria-label={`Não contar ${item.descricao} nos relatórios`}
                      title="Não contar nos relatórios (transferência entre contas ou pagamento de fatura)"
                      disabled={item.duplicada}
                      onClick={() => toggleIgnored(item.externalId)}
                      className={clsx(
                        'col-start-3 row-start-2 justify-self-end rounded-lg p-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed md:col-start-5 md:row-start-1',
                        ignored.has(item.externalId)
                          ? 'bg-inverse text-inverse-fg'
                          : 'text-fg-4 hover:bg-subtle hover:text-fg-2',
                      )}
                    >
                      <EyeOff className="size-4" aria-hidden />
                    </button>
                    <span
                      className={clsx(
                        'col-start-3 row-start-1 text-right text-sm font-medium whitespace-nowrap tabular-nums md:col-start-6',
                        receita ? 'text-success' : 'text-danger-fg',
                      )}
                    >
                      {receita ? '+' : '−'} {formatCurrency(item.valor)}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
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
