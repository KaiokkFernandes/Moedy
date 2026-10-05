import { useState, type FormEvent } from 'react'
import { FormAlert } from '@/components/FormAlert'
import { Button } from '@/components/ui/Button'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { Input } from '@/components/ui/Input'
import { Modal, ModalActions } from '@/components/ui/Modal'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Select } from '@/components/ui/Select'
import { useSaveTransaction } from '@/hooks/useTransactions'
import { getErrorMessage, getFieldErrors } from '@/lib/api'
import { TRANSACTION_TYPE_OPTIONS } from '@/lib/transactionTypes'
import { today } from '@/lib/periods'
import { onlyErrors } from '@/lib/validation'
import type { Account, Category, Transaction, TransactionType } from '@/types/finance'

interface TransactionFormModalProps {
  open: boolean
  onClose: () => void
  accounts: Account[]
  categories: Category[]
  /** Transação em edição; sem ela, o formulário cria uma nova. */
  transaction?: Transaction
  /** Conta pré-selecionada ao criar (ex.: a do filtro atual). */
  defaultAccountId?: string
}

export function TransactionFormModal({ open, onClose, transaction, ...formProps }: TransactionFormModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={transaction ? 'Editar transação' : 'Nova transação'}>
      <TransactionForm transaction={transaction} onClose={onClose} {...formProps} />
    </Modal>
  )
}

function TransactionForm({
  onClose,
  accounts,
  categories,
  transaction,
  defaultAccountId,
}: Omit<TransactionFormModalProps, 'open'>) {
  const saveTransaction = useSaveTransaction()
  const [tipo, setTipo] = useState<TransactionType>(transaction?.tipo ?? 'DESPESA')
  const [valor, setValor] = useState(transaction?.valor ?? 0)
  const [descricao, setDescricao] = useState(transaction?.descricao ?? '')
  const [data, setData] = useState(transaction?.data ?? today())
  const [accountId, setAccountId] = useState(transaction?.accountId ?? (defaultAccountId || accounts[0]?.id) ?? '')
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? '')
  const [ignorarNosRelatorios, setIgnorarNosRelatorios] = useState(transaction?.ignorarNosRelatorios ?? false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')

  const categoryOptions = categories.filter((category) => category.tipo === tipo)

  function changeTipo(next: TransactionType) {
    setTipo(next)
    // A categoria escolhida é do outro tipo e deixa de valer
    setCategoryId('')
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError('')

    const validation = onlyErrors({
      valor: valor > 0 ? '' : 'Informe um valor maior que zero',
      descricao: descricao.trim() ? '' : 'Informe a descrição',
      data: data ? '' : 'Informe a data',
      accountId: accountId ? '' : 'Escolha a conta',
    })
    setErrors(validation)
    if (Object.keys(validation).length > 0) return

    try {
      await saveTransaction.mutateAsync({
        id: transaction?.id,
        data: { tipo, valor, descricao, data, accountId, categoryId: categoryId || null, ignorarNosRelatorios },
      })
      onClose()
    } catch (error) {
      const fieldErrors = getFieldErrors(error)
      setErrors(fieldErrors)
      if (Object.keys(fieldErrors).length === 0) {
        setFormError(getErrorMessage(error, 'Não foi possível salvar a transação.'))
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <FormAlert message={formError} />

      <SegmentedControl label="Tipo" value={tipo} onChange={changeTipo} options={TRANSACTION_TYPE_OPTIONS} />

      <CurrencyInput label="Valor" value={valor} onChange={setValor} error={errors.valor} autoFocus />

      <Input
        label="Descrição"
        placeholder="Ex.: Supermercado, Salário"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        error={errors.descricao}
        maxLength={140}
      />

      <Input label="Data" type="date" value={data} onChange={(e) => setData(e.target.value)} error={errors.data} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Conta" value={accountId} onChange={(e) => setAccountId(e.target.value)} error={errors.accountId}>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.nome}
            </option>
          ))}
        </Select>
        <Select
          label="Categoria"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          error={errors.categoryId}
        >
          <option value="">Sem categoria</option>
          {categoryOptions.map((category) => (
            <option key={category.id} value={category.id}>
              {category.nome}
            </option>
          ))}
        </Select>
      </div>

      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={ignorarNosRelatorios}
          onChange={(e) => setIgnorarNosRelatorios(e.target.checked)}
          className="mt-0.5 size-4 rounded border-slate-300 accent-emerald-600"
        />
        <span>
          Não contar nos relatórios
          <span className="block text-xs text-slate-500">
            Para transferências entre suas contas e pagamento de fatura do cartão. O saldo da conta continua contando.
          </span>
        </span>
      </label>

      <ModalActions>
        <Button variant="secondary" onClick={onClose} disabled={saveTransaction.isPending}>
          Cancelar
        </Button>
        <Button type="submit" loading={saveTransaction.isPending}>
          Salvar
        </Button>
      </ModalActions>
    </form>
  )
}
