import { api } from '@/lib/api'
import type { AiSettings, AiSettingsInput, TransactionSuggestionsResult } from '@/types/ai'
import type { TransactionFilters } from '@/types/finance'

export async function getSettings() {
  return (await api.get<AiSettings>('/settings/ai')).data
}

export async function updateSettings(data: AiSettingsInput) {
  return (await api.put<AiSettings>('/settings/ai', data)).data
}

/** Sugestões de categoria para as transações sem categoria do filtro. Não grava nada. */
export async function suggestForTransactions(filters: Pick<TransactionFilters, 'dataInicio' | 'dataFim' | 'accountId' | 'tipo' | 'busca'>) {
  const body = {
    dataInicio: filters.dataInicio,
    dataFim: filters.dataFim,
    accountId: filters.accountId,
    tipo: filters.tipo,
    busca: filters.busca,
  }
  return (await api.post<TransactionSuggestionsResult>('/transactions/suggest-categories', body)).data
}
