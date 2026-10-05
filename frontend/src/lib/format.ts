const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/** Formata um valor em centavos como moeda brasileira: 123456 → "R$ 1.234,56". */
export function formatCurrency(centavos: number) {
  return brl.format(centavos / 100)
}

/** Formata uma data AAAA-MM-DD (ou ISO completa) como dd/mm/aaaa, sem conversão de fuso. */
export function formatDate(iso: string) {
  const [ano, mes, dia] = iso.slice(0, 10).split('-')
  return `${dia}/${mes}/${ano}`
}

/** Converte um Date para AAAA-MM-DD no fuso local do usuário. */
export function toISODate(date: Date) {
  const mes = String(date.getMonth() + 1).padStart(2, '0')
  const dia = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${mes}-${dia}`
}

export function pluralize(quantidade: number, singular: string, plural: string) {
  return `${quantidade} ${quantidade === 1 ? singular : plural}`
}
