import { api } from '@/lib/api'
import type { Account, AccountInput } from '@/types/finance'

export async function list() {
  return (await api.get<Account[]>('/accounts')).data
}

export async function create(data: AccountInput) {
  return (await api.post<Account>('/accounts', data)).data
}

export async function update(id: string, data: AccountInput) {
  return (await api.put<Account>(`/accounts/${id}`, data)).data
}

/** `confirm` é exigido pela API quando a conta tem transações (elas são apagadas junto). */
export async function remove(id: string, confirm: boolean) {
  await api.delete(`/accounts/${id}`, { params: confirm ? { confirm: true } : undefined })
}
