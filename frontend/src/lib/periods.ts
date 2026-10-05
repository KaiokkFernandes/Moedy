import { toISODate } from './format'

export interface Period {
  inicio: string
  fim: string
}

export function today() {
  return toISODate(new Date())
}

export function thisMonth(): Period {
  const now = new Date()
  return {
    inicio: toISODate(new Date(now.getFullYear(), now.getMonth(), 1)),
    fim: toISODate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  }
}

export function lastMonth(): Period {
  const now = new Date()
  return {
    inicio: toISODate(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
    fim: toISODate(new Date(now.getFullYear(), now.getMonth(), 0)),
  }
}

export function last90Days(): Period {
  const now = new Date()
  return {
    inicio: toISODate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 89)),
    fim: toISODate(now),
  }
}

/** Mês atual como "AAAA-MM". */
export function currentMonth() {
  return today().slice(0, 7)
}

/** Desloca um mês "AAAA-MM": shiftMonth("2026-01", -1) → "2025-12". */
export function shiftMonth(mes: string, delta: number) {
  const [ano, numero] = mes.split('-').map(Number)
  return toISODate(new Date(ano!, numero! - 1 + delta, 1)).slice(0, 7)
}

/** Primeiro e último dia de um mês "AAAA-MM". */
export function monthPeriod(mes: string): Period {
  const [ano, numero] = mes.split('-').map(Number)
  return { inicio: toISODate(new Date(ano!, numero! - 1, 1)), fim: toISODate(new Date(ano!, numero!, 0)) }
}

/** Do início do mês retrasado até o fim do mês atual. */
export function last3Months(): Period {
  return { inicio: monthPeriod(shiftMonth(currentMonth(), -2)).inicio, fim: thisMonth().fim }
}

export function thisYear(): Period {
  const ano = new Date().getFullYear()
  return { inicio: `${ano}-01-01`, fim: `${ano}-12-31` }
}
