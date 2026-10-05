import { useState, type FormEvent } from 'react'
import { FormAlert } from '@/components/FormAlert'
import { Button } from '@/components/ui/Button'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { Modal, ModalActions } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { useSaveBudget } from '@/hooks/useBudgets'
import { getErrorMessage, getFieldErrors } from '@/lib/api'
import { formatCurrency } from '@/lib/format'
import { onlyErrors } from '@/lib/validation'
import type { Budget, BudgetSuggestion } from '@/types/budgets'

interface BudgetFormModalProps {
  open: boolean
  onClose: () => void
  mes: number
  ano: number
  /** Todas as categorias de despesa, com a sugestão de limite e se já têm orçamento no mês. */
  suggestions: BudgetSuggestion[]
  /** Orçamento em edição; sem ele, o formulário cria um novo. */
  budget?: Budget
  /** Categoria pré-selecionada ao criar. */
  defaultCategoryId?: string
}

export function BudgetFormModal({ open, onClose, budget, ...formProps }: BudgetFormModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={budget ? 'Editar orçamento' : 'Novo orçamento'}>
      <BudgetForm budget={budget} onClose={onClose} {...formProps} />
    </Modal>
  )
}

function BudgetForm({ onClose, mes, ano, suggestions, budget, defaultCategoryId }: Omit<BudgetFormModalProps, 'open'>) {
  const saveBudget = useSaveBudget()
  // Ao criar, só entram as categorias que ainda não têm orçamento neste mês
  const options = budget ? suggestions.filter((item) => item.categoryId === budget.categoryId) : suggestions.filter((item) => !item.temOrcamento)

  const [categoryId, setCategoryId] = useState(
    budget?.categoryId ?? options.find((item) => item.categoryId === defaultCategoryId)?.categoryId ?? '',
  )
  const [valorLimite, setValorLimite] = useState(budget?.valorLimite ?? 0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')

  const suggestion = suggestions.find((item) => item.categoryId === categoryId)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError('')

    const validation = onlyErrors({
      categoryId: categoryId ? '' : 'Escolha a categoria',
      valorLimite: valorLimite > 0 ? '' : 'Informe um limite maior que zero',
    })
    setErrors(validation)
    if (Object.keys(validation).length > 0) return

    try {
      await saveBudget.mutateAsync({ id: budget?.id, data: { categoryId, valorLimite, mes, ano } })
      onClose()
    } catch (error) {
      const fieldErrors = getFieldErrors(error)
      setErrors(fieldErrors)
      if (Object.keys(fieldErrors).length === 0) {
        setFormError(getErrorMessage(error, 'Não foi possível salvar o orçamento.'))
      }
    }
  }

  if (!budget && options.length === 0) {
    return (
      <>
        <p className="text-sm text-slate-600">Todas as categorias de despesa já têm orçamento neste mês.</p>
        <ModalActions>
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </ModalActions>
      </>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <FormAlert message={formError} />

      <Select
        label="Categoria"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        error={errors.categoryId}
        disabled={Boolean(budget)}
        hint={budget ? undefined : 'Só aparecem as categorias de despesa que ainda não têm orçamento neste mês.'}
      >
        {!budget && <option value="">Escolha…</option>}
        {options.map((item) => (
          <option key={item.categoryId} value={item.categoryId}>
            {item.nome}
          </option>
        ))}
      </Select>

      <CurrencyInput label="Limite do mês" value={valorLimite} onChange={setValorLimite} error={errors.valorLimite} />

      {suggestion && (
        <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
          {suggestion.sugestao ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>
                Nos últimos 3 meses, você gastou em média <strong className="text-slate-900">{formatCurrency(suggestion.media)}</strong>{' '}
                por mês em {suggestion.nome}.
              </span>
              <Button variant="secondary" size="sm" onClick={() => setValorLimite(suggestion.sugestao!)}>
                Usar {formatCurrency(suggestion.sugestao)}
              </Button>
            </div>
          ) : (
            `Ainda não há gastos em ${suggestion.nome} nos últimos 3 meses para sugerir um limite.`
          )}
        </div>
      )}

      <ModalActions>
        <Button variant="secondary" onClick={onClose} disabled={saveBudget.isPending}>
          Cancelar
        </Button>
        <Button type="submit" loading={saveBudget.isPending}>
          Salvar
        </Button>
      </ModalActions>
    </form>
  )
}
