import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { Sparkles } from 'lucide-react'
import { CategoryPillSelect } from '@/components/categories/CategoryPillSelect'
import { AiNotice } from '@/components/categorizacao/AiNotice'
import { OrigemBadge } from '@/components/categorizacao/OrigemBadge'
import { FormAlert } from '@/components/FormAlert'
import { Button } from '@/components/ui/Button'
import { Modal, ModalActions } from '@/components/ui/Modal'
import { EmptyState, Loading } from '@/components/ui/States'
import { useSuggestForTransactions } from '@/hooks/useAi'
import { useInvalidateFinance } from '@/hooks/useInvalidateFinance'
import { getErrorMessage } from '@/lib/api'
import { formatCurrency, formatDate, pluralize } from '@/lib/format'
import * as transactionsService from '@/services/transactions'
import type { Category, TransactionFilters } from '@/types/finance'
import type { TransactionSuggestionsResult } from '@/types/ai'

interface SugestoesIaModalProps {
  open: boolean
  onClose: () => void
  filters: TransactionFilters
  categories: Category[]
}

export function SugestoesIaModal({ open, onClose, filters, categories }: SugestoesIaModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Sugestões de categoria com IA">
      <SugestoesBody filters={filters} categories={categories} onClose={onClose} />
    </Modal>
  )
}

/** Mesma lógica de revisão da importação: o usuário confere, ajusta e só então grava. */
function SugestoesBody({ filters, categories, onClose }: Omit<SugestoesIaModalProps, 'open'>) {
  const suggest = useSuggestForTransactions()
  const invalidate = useInvalidateFinance()
  const [result, setResult] = useState<TransactionSuggestionsResult | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [categoryById, setCategoryById] = useState<Record<string, string>>({})
  const [aplicando, setAplicando] = useState(false)
  const [erro, setErro] = useState('')
  const pediu = useRef(false)

  // Uma única análise por abertura do modal (o StrictMode do React executa efeitos duas vezes)
  useEffect(() => {
    if (pediu.current) return
    pediu.current = true
    suggest.mutate(filters, {
      onSuccess: (data) => {
        setResult(data)
        setSelected(new Set(data.itens.map((item) => item.transactionId)))
        setCategoryById(Object.fromEntries(data.itens.map((item) => [item.transactionId, item.categoryId])))
      },
    })
    // Os filtros são os do momento em que o modal abriu
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function aplicar() {
    if (!result) return
    setAplicando(true)
    setErro('')
    // Sem categoria escolhida (o usuário limpou a sugestão), o lançamento fica de fora
    const escolhidas = result.itens.filter((item) => selected.has(item.transactionId) && categoryById[item.transactionId])
    let aplicadas = 0
    try {
      for (const item of escolhidas) {
        const categoryId = categoryById[item.transactionId]!
        // Aceitar a sugestão da IA grava a origem IA; escolher outra categoria vira manual
        const origem = categoryId === item.categoryId && item.origem === 'IA' ? 'IA' : 'MANUAL'
        await transactionsService.updateCategory(item.transactionId, categoryId, origem)
        aplicadas += 1
      }
      await invalidate()
      onClose()
    } catch (error) {
      setErro(`${getErrorMessage(error, 'Não foi possível aplicar todas as categorias.')} ${aplicadas} aplicada(s) antes da falha.`)
      await invalidate()
    } finally {
      setAplicando(false)
    }
  }

  if (suggest.isPending) {
    return <Loading label="Analisando as transações sem categoria…" />
  }

  if (suggest.isError) {
    const semIa = /Ative a IA/.test(getErrorMessage(suggest.error, ''))
    return (
      <div className="space-y-4">
        <FormAlert message={getErrorMessage(suggest.error, 'Não foi possível analisar as transações.')} />
        {semIa && (
          <p className="text-sm text-slate-600">
            Ligue a opção em{' '}
            <Link to="/configuracoes" className="font-medium text-emerald-700 hover:underline" onClick={onClose}>
              Configurações
            </Link>{' '}
            para usar as sugestões por IA.
          </p>
        )}
        <ModalActions>
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </ModalActions>
      </div>
    )
  }

  if (!result) return null

  if (result.total === 0) {
    return (
      <>
        <EmptyState icon={Sparkles} title="Nada para categorizar" description="Não há transações sem categoria neste filtro." />
        <ModalActions>
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </ModalActions>
      </>
    )
  }

  return (
    <div className="space-y-4">
      <AiNotice ia={{ ...result.ia, motivo: result.ia.motivo }} />

      <p className="text-sm text-slate-600">
        {result.itens.length === 0
          ? 'Nenhuma sugestão para as transações sem categoria deste filtro.'
          : `${pluralize(result.itens.length, 'sugestão', 'sugestões')} para revisar.`}
        {result.semSugestao > 0 && ` ${pluralize(result.semSugestao, 'transação ficou', 'transações ficaram')} sem sugestão.`}
        {result.naoAnalisadas > 0 && ` ${pluralize(result.naoAnalisadas, 'transação não foi analisada', 'transações não foram analisadas')} por causa do limite por vez.`}
      </p>

      {result.itens.length > 0 && (
        <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto rounded-xl ring-1 ring-slate-200">
          {result.itens.map((item) => {
            const options = categories.filter((category) => category.tipo === item.tipo)
            const current = categoryById[item.transactionId] ?? item.categoryId
            return (
              <li key={item.transactionId} className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 px-3 py-2.5">
                <input
                  type="checkbox"
                  aria-label={`Aplicar sugestão para ${item.descricao}`}
                  checked={selected.has(item.transactionId)}
                  onChange={() => toggle(item.transactionId)}
                  className="mt-1 size-4 rounded border-slate-300 accent-emerald-600"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{item.descricao}</p>
                  <p className={clsx('text-xs tabular-nums', item.tipo === 'RECEITA' ? 'text-emerald-700' : 'text-red-700')}>
                    {formatDate(item.data)} · {item.tipo === 'RECEITA' ? '+' : '−'} {formatCurrency(item.valor)}
                  </p>
                </div>
                <div className="col-start-2 flex flex-wrap items-center gap-2">
                  <CategoryPillSelect
                    label={`Categoria de ${item.descricao}`}
                    value={current}
                    onChange={(categoryId) => setCategoryById((prev) => ({ ...prev, [item.transactionId]: categoryId ?? '' }))}
                    options={options}
                    disabled={aplicando}
                  />
                  <OrigemBadge origem={item.origem} confianca={item.origem === 'IA' ? item.confianca : null} />
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <FormAlert message={erro} />

      <ModalActions>
        <Button variant="secondary" onClick={onClose} disabled={aplicando}>
          Cancelar
        </Button>
        <Button onClick={aplicar} loading={aplicando} disabled={selected.size === 0}>
          Aplicar {pluralize(selected.size, 'categoria', 'categorias')}
        </Button>
      </ModalActions>
    </div>
  )
}
