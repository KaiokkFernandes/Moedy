import { useState, type FormEvent } from 'react'
import { GroupedCategoryOptions } from '@/components/categories/CategoryOptions'
import { FormAlert } from '@/components/FormAlert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal, ModalActions } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { useApplyCategoryRules, useSaveCategoryRule } from '@/hooks/useCategoryRules'
import { getErrorMessage, getFieldErrors } from '@/lib/api'
import { onlyErrors } from '@/lib/validation'
import type { Category } from '@/types/finance'
import type { CategoryRule } from '@/types/import'

export interface RuleSavedResult {
  rule: CategoryRule
  /** Quantas transações foram categorizadas, quando o usuário pediu para aplicar a regra ao salvar. */
  categorizadas?: number
}

interface RuleFormModalProps {
  open: boolean
  onClose: () => void
  categories: Category[]
  /** Regra em edição; sem ela, o formulário cria uma nova. */
  rule?: CategoryRule
  /** Valores iniciais ao criar (ex.: sugeridos a partir de uma transação). */
  defaults?: { palavraChave: string; categoryId: string }
  /** Mostra a opção de já aplicar as regras às transações sem categoria. */
  offerApply?: boolean
  onSaved?: (result: RuleSavedResult) => void
}

export function RuleFormModal({ open, onClose, rule, ...formProps }: RuleFormModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={rule ? 'Editar regra' : 'Nova regra'}>
      <RuleForm rule={rule} onClose={onClose} {...formProps} />
    </Modal>
  )
}

function RuleForm({ onClose, categories, rule, defaults, offerApply, onSaved }: Omit<RuleFormModalProps, 'open'>) {
  const saveRule = useSaveCategoryRule()
  const applyRules = useApplyCategoryRules()
  const [palavraChave, setPalavraChave] = useState(rule?.palavraChave ?? defaults?.palavraChave ?? '')
  const [categoryId, setCategoryId] = useState(rule?.categoryId ?? defaults?.categoryId ?? '')
  const [applyNow, setApplyNow] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const saving = saveRule.isPending || applyRules.isPending

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError('')

    const validation = onlyErrors({
      palavraChave: palavraChave.trim().length >= 2 ? '' : 'A palavra-chave deve ter pelo menos 2 caracteres',
      categoryId: categoryId ? '' : 'Escolha a categoria',
    })
    setErrors(validation)
    if (Object.keys(validation).length > 0) return

    try {
      const saved = await saveRule.mutateAsync({ id: rule?.id, data: { palavraChave, categoryId } })
      const applied = offerApply && applyNow ? await applyRules.mutateAsync() : undefined
      onSaved?.({ rule: saved, categorizadas: applied?.categorizadas })
      onClose()
    } catch (error) {
      const fieldErrors = getFieldErrors(error)
      setErrors(fieldErrors)
      if (Object.keys(fieldErrors).length === 0) {
        setFormError(getErrorMessage(error, 'Não foi possível salvar a regra.'))
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <FormAlert message={formError} />
      <Input
        label="Palavra-chave"
        placeholder="Ex.: ifood, posto, netflix"
        value={palavraChave}
        onChange={(e) => setPalavraChave(e.target.value)}
        error={errors.palavraChave}
        hint="Transações cuja descrição contém este texto recebem a categoria. Acentos e maiúsculas são ignorados."
        maxLength={60}
        autoFocus
      />
      <Select
        label="Categoria"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        error={errors.categoryId}
      >
        <option value="">Escolha…</option>
        <GroupedCategoryOptions categories={categories} />
      </Select>

      {offerApply && (
        <label className="flex items-start gap-2 text-sm text-fg-2">
          <input
            type="checkbox"
            checked={applyNow}
            onChange={(e) => setApplyNow(e.target.checked)}
            className="mt-0.5 size-4 rounded border-line-strong accent-accent"
          />
          Aplicar agora às transações que estão sem categoria
        </label>
      )}

      <ModalActions>
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" loading={saving}>
          Salvar
        </Button>
      </ModalActions>
    </form>
  )
}
