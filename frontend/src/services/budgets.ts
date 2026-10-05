import { api } from '@/lib/api'
import type { BudgetInput, BudgetList, BudgetSuggestion } from '@/types/budgets'

interface Month {
  mes: number
  ano: number
}

export async function list(month: Month) {
  return (await api.get<BudgetList>('/budgets', { params: month })).data
}

export async function suggestions(month: Month) {
  return (await api.get<{ sugestoes: BudgetSuggestion[] }>('/budgets/suggestions', { params: month })).data.sugestoes
}

export async function create(data: BudgetInput) {
  await api.post('/budgets', data)
}

export async function update(id: string, data: BudgetInput) {
  await api.put(`/budgets/${id}`, data)
}

export async function remove(id: string) {
  await api.delete(`/budgets/${id}`)
}

/** Copia os orçamentos de um mês para outro, sem sobrescrever os que já existem no destino. */
export async function copy(from: Month, to: Month) {
  const body = { deMes: from.mes, deAno: from.ano, paraMes: to.mes, paraAno: to.ano }
  return (await api.post<{ copiados: number; ignorados: number }>('/budgets/copy', body)).data
}

/** Cria os orçamentos sugeridos para as categorias que ainda não têm um no mês. */
export async function createFromSuggestions(month: Month) {
  return (await api.post<{ criados: number }>('/budgets/from-suggestions', month)).data
}
