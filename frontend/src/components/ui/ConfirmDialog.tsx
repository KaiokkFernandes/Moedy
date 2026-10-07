import type { ReactNode } from 'react'
import { FormAlert } from '@/components/FormAlert'
import { Button } from './Button'
import { Modal, ModalActions } from './Modal'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  children: ReactNode
  confirmLabel?: string
  loading?: boolean
  error?: string
}

/** Confirmação de ações destrutivas (exclusões). */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  children,
  confirmLabel = 'Excluir',
  loading = false,
  error = '',
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-3 text-sm text-fg-2">
        <FormAlert message={error} />
        {children}
      </div>
      <ModalActions>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </ModalActions>
    </Modal>
  )
}
