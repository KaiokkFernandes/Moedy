import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { normalizeText, suggestKeyword } from './text.ts'

describe('texto', () => {
  it('normaliza igual à API (sem acento, minúsculas, espaços simples)', () => {
    assert.equal(normalizeText('  Pão de   AÇÚCAR '), 'pao de acucar')
  })

  describe('palavra-chave sugerida para uma regra', () => {
    const casos: [string, string][] = [
      ['iFood - Burger King', 'ifood'],
      ['UBER *TRIP', 'uber'],
      ['PIX enviado - João Silva', 'joao silva'],
      ['COMPRA CARTAO NETFLIX.COM', 'netflix'],
      ['PAGAMENTO DE BOLETO ENERGISA', 'boleto energisa'],
      ['Supermercado Pão de Açúcar', 'supermercado pao'],
    ]
    for (const [descricao, esperado] of casos) {
      it(`"${descricao}" → "${esperado}"`, () => assert.equal(suggestKeyword(descricao), esperado))
    }

    it('a sugestão sempre aparece na descrição (senão a regra não casaria)', () => {
      for (const [descricao] of casos) {
        assert.ok(normalizeText(descricao).includes(suggestKeyword(descricao)), descricao)
      }
    })

    it('descrição só com ruído devolve o próprio texto normalizado', () => {
      assert.equal(suggestKeyword('PIX 123'), 'pix 123')
    })
  })
})
