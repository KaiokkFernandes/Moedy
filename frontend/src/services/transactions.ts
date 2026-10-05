import { api } from '@/lib/api'
import type { Transaction, TransactionFilters, TransactionInput, TransactionList } from '@/types/finance'

export async function list(filters: TransactionFilters) {
  // O axios omite os parâmetros undefined
  return (await api.get<TransactionList>('/transactions', { params: filters })).data
}

export async function create(data: TransactionInput) {
  return (await api.post<Transaction>('/transactions', data)).data
}

export async function update(id: string, data: TransactionInput) {
  return (await api.put<Transaction>(`/transactions/${id}`, data)).data
}

export async function updateCategory(id: string, categoryId: string | null) {
  return (await api.patch<Transaction>(`/transactions/${id}/category`, { categoryId })).data
}

export async function remove(id: string) {
  await api.delete(`/transactions/${id}`)
}
