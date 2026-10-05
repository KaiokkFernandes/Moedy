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
