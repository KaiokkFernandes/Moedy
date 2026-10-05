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

const compact = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })

/** Valor em centavos de forma curta, para eixos de gráfico: 150000 → "R$ 1,5 mil". */
export function formatCompactCurrency(centavos: number) {
  return `R$ ${compact.format(centavos / 100)}`
}

const percent = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })

/** 12.5 → "12,5%". */
export function formatPercent(value: number) {
  return `${percent.format(value)}%`
}

const MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const MONTHS_LONG = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

/** "2026-10" → "out/26". */
export function formatMonthShort(mes: string) {
  const [ano, numero] = mes.split('-')
  return `${MONTHS_SHORT[Number(numero) - 1]}/${ano!.slice(2)}`
}

/** "2026-10" → "outubro de 2026". */
export function formatMonthLong(mes: string) {
  const [ano, numero] = mes.split('-')
  return `${MONTHS_LONG[Number(numero) - 1]} de ${ano}`
}

/** "2026-10" → "outubro". */
export function formatMonthName(mes: string) {
  return MONTHS_LONG[Number(mes.split('-')[1]) - 1]!
}

/** Tempo decorrido desde uma data ISO: "agora", "há 5 min", "há 3 h", "há 2 dias" ou a data. */
export function formatRelativeTime(iso: string) {
  const minutos = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (minutos < 1) return 'agora'
  if (minutos < 60) return `há ${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `há ${horas} h`
  const dias = Math.floor(horas / 24)
  if (dias < 7) return dias === 1 ? 'há 1 dia' : `há ${dias} dias`
  return formatDate(toISODate(new Date(iso)))
}
