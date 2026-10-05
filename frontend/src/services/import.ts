import { api } from '@/lib/api'
import type { CsvMapping, ImportItem, ImportPreview, ImportResult } from '@/types/import'

/** Envia o arquivo para leitura; nada é gravado. Para CSV, chame de novo com o mapeamento das colunas. */
export async function preview(accountId: string, file: File, mapeamento?: CsvMapping) {
  const form = new FormData()
  form.append('accountId', accountId)
  if (mapeamento) form.append('mapeamento', JSON.stringify(mapeamento))
  form.append('arquivo', file)
  return (await api.post<ImportPreview>('/import/preview', form)).data
}

export async function confirm(accountId: string, itens: ImportItem[]) {
  return (
    await api.post<ImportResult>('/import/confirm', {
      accountId,
      itens: itens.map(({ data, descricao, valor, tipo, externalId, categoryId, origemCategoria, ignorarNosRelatorios }) => ({
        data,
        descricao,
        valor,
        tipo,
        externalId,
        categoryId,
        origemCategoria,
        ignorarNosRelatorios,
      })),
    })
  ).data
}
