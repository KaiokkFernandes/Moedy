import { api } from '@/lib/api'
import type { ApplyRulesResult, CategoryRule, CategoryRuleInput } from '@/types/import'

export async function list() {
  return (await api.get<CategoryRule[]>('/category-rules')).data
}

export async function create(data: CategoryRuleInput) {
  return (await api.post<CategoryRule>('/category-rules', data)).data
}

export async function update(id: string, data: CategoryRuleInput) {
  return (await api.put<CategoryRule>(`/category-rules/${id}`, data)).data
}

export async function remove(id: string) {
  await api.delete(`/category-rules/${id}`)
}

/** Aplica as regras às transações que estão sem categoria. */
export async function apply() {
  return (await api.post<ApplyRulesResult>('/category-rules/apply')).data
}
