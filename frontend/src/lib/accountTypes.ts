import { Banknote, CreditCard, Landmark, PiggyBank, type LucideIcon } from 'lucide-react'
import type { AccountType } from '@/types/finance'

export const ACCOUNT_TYPES: Record<AccountType, { label: string; icon: LucideIcon }> = {
  CORRENTE: { label: 'Conta corrente', icon: Landmark },
  POUPANCA: { label: 'Poupança', icon: PiggyBank },
  CARTAO: { label: 'Cartão de crédito', icon: CreditCard },
  DINHEIRO: { label: 'Dinheiro', icon: Banknote },
}
