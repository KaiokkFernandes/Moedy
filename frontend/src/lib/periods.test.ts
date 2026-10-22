import assert from 'node:assert/strict'
import { after, before, describe, it, mock } from 'node:test'
import { currentMonth, last3Months, last90Days, lastMonth, monthPeriod, shiftMonth, thisMonth, thisYear, today } from './periods.ts'

describe('períodos dos filtros', () => {
  // 15 de março de 2026, meio-dia no fuso local: o resultado é o mesmo em qualquer fuso
  before(() => mock.timers.enable({ apis: ['Date'], now: new Date(2026, 2, 15, 12, 0) }))
  after(() => mock.timers.reset())

  it('hoje e mês atual', () => {
    assert.equal(today(), '2026-03-15')
    assert.equal(currentMonth(), '2026-03')
  })

  it('este mês e o mês passado (fevereiro de 28 dias)', () => {
    assert.deepEqual(thisMonth(), { inicio: '2026-03-01', fim: '2026-03-31' })
    assert.deepEqual(lastMonth(), { inicio: '2026-02-01', fim: '2026-02-28' })
  })

  it('últimos 90 dias incluem hoje', () => {
    assert.deepEqual(last90Days(), { inicio: '2025-12-16', fim: '2026-03-15' })
  })

  it('últimos 3 meses: do mês retrasado ao fim do atual', () => {
    assert.deepEqual(last3Months(), { inicio: '2026-01-01', fim: '2026-03-31' })
  })

  it('ano atual', () => {
    assert.deepEqual(thisYear(), { inicio: '2026-01-01', fim: '2026-12-31' })
  })

  it('deslocar mês atravessa o ano nos dois sentidos', () => {
    assert.equal(shiftMonth('2026-01', -1), '2025-12')
    assert.equal(shiftMonth('2025-12', 1), '2026-01')
    assert.equal(shiftMonth('2026-03', -14), '2025-01')
  })

  it('período de um mês, inclusive fevereiro bissexto', () => {
    assert.deepEqual(monthPeriod('2028-02'), { inicio: '2028-02-01', fim: '2028-02-29' })
    assert.deepEqual(monthPeriod('2026-12'), { inicio: '2026-12-01', fim: '2026-12-31' })
  })
})
