import { api } from '@/lib/api'
import type { Category, CategoryInput } from '@/types/finance'

export async function list() {
  return (await api.get<Category[]>('/categories')).data
}

export async function create(data: CategoryInput) {
  return (await api.post<Category>('/categories', data)).data
}

export async function update(id: string, data: CategoryInput) {
  return (await api.put<Category>(`/categories/${id}`, data)).data
}

export async function remove(id: string) {
  await api.delete(`/categories/${id}`)
}
