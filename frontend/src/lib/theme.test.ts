import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { resolverTema } from './theme.js'
import { contraste, corParaTema } from './color.js'

describe('resolverTema', () => {
  it('escolha explícita vence o sistema', () => {
    assert.equal(resolverTema('claro', true), 'claro')
    assert.equal(resolverTema('escuro', false), 'escuro')
  })

  it('sistema segue o aparelho', () => {
    assert.equal(resolverTema('sistema', true), 'escuro')
    assert.equal(resolverTema('sistema', false), 'claro')
  })
})

describe('corParaTema (cores de categoria no escuro)', () => {
  it('no tema claro, a cor salva não muda', () => {
    assert.equal(corParaTema('#1e3a8a', false), '#1e3a8a')
  })

  it('no escuro, cor escura demais é clareada até 3:1 sobre a superfície', () => {
    const exibida = corParaTema('#1e3a8a', true)
    assert.notEqual(exibida, '#1e3a8a')
    assert.ok(contraste(exibida, '#171a21') >= 3, `contraste ${contraste(exibida, '#171a21').toFixed(2)}`)
  })

  it('no escuro, cor já legível não é alterada', () => {
    assert.equal(corParaTema('#8b5cf6', true), '#8b5cf6')
  })
})
