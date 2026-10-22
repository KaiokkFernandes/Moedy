import assert from 'node:assert/strict'
import { describe, it, mock } from 'node:test'
import {
  formatCompactCurrency,
  formatCurrency,
  formatDate,
  formatMonthLong,
  formatMonthName,
  formatMonthShort,
  formatPercent,
  formatRelativeTime,
  pluralize,
  toISODate,
} from './format.ts'

// O Intl usa espaço não separável entre "R$" e o número
const reais = (texto: string) => texto.replace(/ /g, ' ')

describe('formatação na interface', () => {
  it('centavos como moeda brasileira', () => {
    assert.equal(reais(formatCurrency(123456)), 'R$ 1.234,56')
    assert.equal(reais(formatCurrency(5)), 'R$ 0,05')
    assert.equal(reais(formatCurrency(-2500)), '-R$ 25,00')
  })

  it('valor curto para eixos de gráfico', () => {
    assert.equal(reais(formatCompactCurrency(150000)), 'R$ 1,5 mil')
    assert.equal(reais(formatCompactCurrency(99900)), 'R$ 999')
  })

  it('data AAAA-MM-DD como dd/mm/aaaa, sem mexer no fuso', () => {
    assert.equal(formatDate('2026-10-05'), '05/10/2026')
    // Meia-noite UTC continua sendo o dia 1, mesmo no Brasil (UTC-3)
    assert.equal(formatDate('2026-10-01T00:00:00.000Z'), '01/10/2026')
  })

  it('Date no fuso local para AAAA-MM-DD', () => {
    assert.equal(toISODate(new Date(2026, 0, 5, 23, 59)), '2026-01-05')
  })

  it('plural, percentual e meses', () => {
    assert.equal(pluralize(1, 'conta', 'contas'), '1 conta')
    assert.equal(pluralize(0, 'conta', 'contas'), '0 contas')
    assert.equal(formatPercent(12.5), '12,5%')
    assert.equal(formatMonthShort('2026-10'), 'out/26')
    assert.equal(formatMonthLong('2026-03'), 'março de 2026')
    assert.equal(formatMonthName('2026-12'), 'dezembro')
  })

  it('tempo relativo dos alertas', () => {
    const agora = new Date(2026, 9, 21, 12, 0)
    mock.timers.enable({ apis: ['Date'], now: agora })
    try {
      const ha = (minutos: number) => new Date(agora.getTime() - minutos * 60_000).toISOString()
      assert.equal(formatRelativeTime(ha(0)), 'agora')
      assert.equal(formatRelativeTime(ha(5)), 'há 5 min')
      assert.equal(formatRelativeTime(ha(59)), 'há 59 min')
      assert.equal(formatRelativeTime(ha(3 * 60)), 'há 3 h')
      assert.equal(formatRelativeTime(ha(24 * 60)), 'há 1 dia')
      assert.equal(formatRelativeTime(ha(6 * 24 * 60)), 'há 6 dias')
      assert.equal(formatRelativeTime(ha(8 * 24 * 60)), '13/10/2026')
    } finally {
      mock.timers.reset()
    }
  })
})
