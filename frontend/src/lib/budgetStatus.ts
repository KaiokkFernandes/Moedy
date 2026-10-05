import type { BudgetStatus } from '@/types/budgets'

/** A mesma regra da API: atenção a partir de 80%, estourado a partir de 100%. */
export function statusOfPercent(percentual: number): BudgetStatus {
  return percentual >= 100 ? 'ESTOURADO' : percentual >= 80 ? 'ATENCAO' : 'OK'
}
