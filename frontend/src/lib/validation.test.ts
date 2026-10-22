import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { statusOfPercent } from './budgetStatus.ts'
import { contraste, corParaTema } from './color.ts'
import { onlyErrors, validateEmail } from './validation.ts'

describe('validação de formulários', () => {
  it('email', () => {
    assert.equal(validateEmail(''), 'Informe o email')
    assert.equal(validateEmail('   '), 'Informe o email')
    assert.equal(validateEmail('kaio@'), 'Email inválido')
    assert.equal(validateEmail('kaio @gmail.com'), 'Email inválido')
    assert.equal(validateEmail(' kaio@gmail.com '), '')
  })

  it('só os campos com erro', () => {
    assert.deepEqual(onlyErrors({ email: '', senha: 'Informe a senha' }), { senha: 'Informe a senha' })
  })
})

describe('status do orçamento (mesma regra da API)', () => {
  it('OK abaixo de 80%, atenção a partir de 80% e estourado a partir de 100%', () => {
    assert.deepEqual([0, 79.9, 80, 99.9, 100, 250].map(statusOfPercent), ['OK', 'OK', 'ATENCAO', 'ATENCAO', 'ESTOURADO', 'ESTOURADO'])
  })
})

describe('cores das categorias no tema', () => {
  it('contraste segue a fórmula do WCAG', () => {
    assert.equal(Math.round(contraste('#ffffff', '#000000')), 21)
    assert.equal(contraste('#123456', '#123456'), 1)
  })

  it('no tema claro a cor salva não muda', () => {
    assert.equal(corParaTema('#1e293b', false), '#1e293b')
  })

  it('no escuro, cores escuras clareiam até ter contraste 3:1 com o fundo', () => {
    const cor = corParaTema('#1e293b', true)
    assert.notEqual(cor, '#1e293b')
    assert.ok(contraste(cor, '#171a21') >= 3)
  })

  it('no escuro, cores que já contrastam ficam como estão', () => {
    assert.equal(corParaTema('#22c55e', true), '#22c55e')
  })
})
