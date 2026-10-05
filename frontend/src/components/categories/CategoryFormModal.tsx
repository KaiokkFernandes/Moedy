import { useState, type FormEvent } from 'react'
import clsx from 'clsx'
import { Check } from 'lucide-react'
import { FormAlert } from '@/components/FormAlert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal, ModalActions } from '@/components/ui/Modal'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { useSaveCategory } from '@/hooks/useCategories'
import { getErrorMessage, getFieldErrors } from '@/lib/api'
import { TRANSACTION_TYPE_OPTIONS } from '@/lib/transactionTypes'
import { CATEGORY_COLORS, CATEGORY_ICONS } from '@/lib/categoryOptions'
import type { Category, TransactionType } from '@/types/finance'
import { CategoryIcon } from './CategoryIcon'

interface CategoryFormModalProps {
  open: boolean
  onClose: () => void
  /** Categoria em edição; sem ela, o formulário cria uma nova. */
  category?: Category
  /** Tipo pré-selecionado ao criar. */
  defaultTipo?: TransactionType
}

export function CategoryFormModal({ open, onClose, category, defaultTipo }: CategoryFormModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={category ? 'Editar categoria' : 'Nova categoria'}>
      <CategoryForm category={category} defaultTipo={defaultTipo} onClose={onClose} />
    </Modal>
  )
}

function CategoryForm({ category, defaultTipo = 'DESPESA', onClose }: Omit<CategoryFormModalProps, 'open'>) {
  const saveCategory = useSaveCategory()
  const [nome, setNome] = useState(category?.nome ?? '')
  const [tipo, setTipo] = useState<TransactionType>(category?.tipo ?? defaultTipo)
  const [cor, setCor] = useState(category?.cor ?? CATEGORY_COLORS[8])
  const [icone, setIcone] = useState(category?.icone ?? 'tag')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')

  // Uma cor antiga fora da paleta continua aparecendo como opção
  const colors = CATEGORY_COLORS.includes(cor) ? CATEGORY_COLORS : [cor, ...CATEGORY_COLORS]

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError('')

    if (!nome.trim()) {
      setErrors({ nome: 'Informe o nome da categoria' })
      return
    }
    setErrors({})

    try {
      await saveCategory.mutateAsync({ id: category?.id, data: { nome, tipo, cor, icone } })
      onClose()
    } catch (error) {
      const fieldErrors = getFieldErrors(error)
      setErrors(fieldErrors)
      if (Object.keys(fieldErrors).length === 0) {
        setFormError(getErrorMessage(error, 'Não foi possível salvar a categoria.'))
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <FormAlert message={formError} />

      <SegmentedControl label="Tipo" value={tipo} onChange={setTipo} options={TRANSACTION_TYPE_OPTIONS} />

      <div className="flex items-end gap-3">
        <CategoryIcon icone={icone} cor={cor} />
        <div className="flex-1">
          <Input
            label="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            error={errors.nome}
            maxLength={40}
            autoFocus
          />
        </div>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-slate-700">Cor</legend>
        <div className="flex flex-wrap gap-2">
          {colors.map((option) => (
            <button
              key={option}
              type="button"
              aria-label={`Cor ${option}`}
              aria-pressed={option === cor}
              onClick={() => setCor(option)}
              className="flex size-8 items-center justify-center rounded-full text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
              style={{ backgroundColor: option }}
            >
              {option === cor && <Check className="size-4" aria-hidden />}
            </button>
          ))}
        </div>
        {errors.cor && <p className="mt-1 text-sm text-red-600">{errors.cor}</p>}
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-slate-700">Ícone</legend>
        <div className="grid grid-cols-8 gap-1">
          {Object.entries(CATEGORY_ICONS).map(([name, Icon]) => (
            <button
              key={name}
              type="button"
              aria-label={`Ícone ${name}`}
              aria-pressed={name === icone}
              onClick={() => setIcone(name)}
              className={clsx(
                'flex aspect-square items-center justify-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500',
                name === icone ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100',
              )}
            >
              <Icon className="size-4.5" aria-hidden />
            </button>
          ))}
        </div>
        {errors.icone && <p className="mt-1 text-sm text-red-600">{errors.icone}</p>}
      </fieldset>

      <ModalActions>
        <Button variant="secondary" onClick={onClose} disabled={saveCategory.isPending}>
          Cancelar
        </Button>
        <Button type="submit" loading={saveCategory.isPending}>
          Salvar
        </Button>
      </ModalActions>
    </form>
  )
}
