import { useState, type FormEvent } from 'react'
import { FormAlert } from '@/components/FormAlert'
import { Button } from '@/components/ui/Button'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { Input } from '@/components/ui/Input'
import { Modal, ModalActions } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { useSaveAccount } from '@/hooks/useAccounts'
import { ACCOUNT_TYPES } from '@/lib/accountTypes'
import { getErrorMessage, getFieldErrors } from '@/lib/api'
import type { Account, AccountType } from '@/types/finance'

interface AccountFormModalProps {
  open: boolean
  onClose: () => void
  /** Conta em edição; sem ela, o formulário cria uma nova. */
  account?: Account
}

export function AccountFormModal({ open, onClose, account }: AccountFormModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={account ? 'Editar conta' : 'Nova conta'}>
      <AccountForm account={account} onClose={onClose} />
    </Modal>
  )
}

function AccountForm({ account, onClose }: Omit<AccountFormModalProps, 'open'>) {
  const saveAccount = useSaveAccount()
  const [nome, setNome] = useState(account?.nome ?? '')
  const [tipo, setTipo] = useState<AccountType>(account?.tipo ?? 'CORRENTE')
  const [saldoInicial, setSaldoInicial] = useState(account?.saldoInicial ?? 0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError('')

    if (!nome.trim()) {
      setErrors({ nome: 'Informe o nome da conta' })
      return
    }
    setErrors({})

    try {
      await saveAccount.mutateAsync({ id: account?.id, data: { nome, tipo, saldoInicial } })
      onClose()
    } catch (error) {
      const fieldErrors = getFieldErrors(error)
      setErrors(fieldErrors)
      if (Object.keys(fieldErrors).length === 0) {
        setFormError(getErrorMessage(error, 'Não foi possível salvar a conta.'))
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <FormAlert message={formError} />
      <Input
        label="Nome"
        placeholder="Ex.: Nubank, Carteira"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        error={errors.nome}
        maxLength={60}
        autoFocus
      />
      <Select label="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value as AccountType)} error={errors.tipo}>
        {Object.entries(ACCOUNT_TYPES).map(([value, { label }]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>
      <CurrencyInput
        label="Saldo inicial"
        value={saldoInicial}
        onChange={setSaldoInicial}
        error={errors.saldoInicial}
        hint="Saldo da conta antes das transações lançadas aqui. Digite − para um saldo negativo."
        allowNegative
      />
      <ModalActions>
        <Button variant="secondary" onClick={onClose} disabled={saveAccount.isPending}>
          Cancelar
        </Button>
        <Button type="submit" loading={saveAccount.isPending}>
          Salvar
        </Button>
      </ModalActions>
    </form>
  )
}
