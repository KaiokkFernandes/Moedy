import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { PASSOS_TOUR, seletorDoAlvo, tourReducer } from './passos.ts'
import { areaDestacada, posicionarBalao } from './posicao.ts'
import { primeirosPassos } from './primeirosPassos.ts'

describe('passos do tour', () => {
  it('ids únicos; começa e termina sem alvo (balão no centro)', () => {
    assert.equal(new Set(PASSOS_TOUR.map((p) => p.id)).size, PASSOS_TOUR.length)
    assert.equal(PASSOS_TOUR[0]?.alvo, undefined)
    assert.equal(PASSOS_TOUR.at(-1)?.alvo, undefined)
  })

  it('passo de clique tem alvo, e o passo seguinte está na página para onde o clique leva', () => {
    for (const [indice, passo] of PASSOS_TOUR.entries()) {
      if (passo.acao !== 'clique') continue
      assert.ok(passo.alvo, passo.id)
      const destino = passo.alvo.replace(/^nav-/, '/')
      assert.equal(PASSOS_TOUR[indice + 1]?.rota, destino, `depois de "${passo.id}"`)
    }
  })

  it('textos curtos o bastante para caber no balão', () => {
    for (const passo of PASSOS_TOUR) assert.ok(passo.texto.length <= 160, `${passo.id}: ${passo.texto.length} caracteres`)
  })

  it('seletor do alvo', () => {
    assert.equal(seletorDoAlvo('nav-contas'), '[data-tour="nav-contas"]')
  })
})

describe('navegação do tour', () => {
  it('iniciar vai para o primeiro passo', () => {
    assert.equal(tourReducer(null, { tipo: 'iniciar' }, 3), 0)
    assert.equal(tourReducer(2, { tipo: 'iniciar' }, 3), 0)
    assert.equal(tourReducer(null, { tipo: 'iniciar' }, 0), null)
  })

  it('avançar até o fim encerra', () => {
    assert.equal(tourReducer(0, { tipo: 'avancar' }, 3), 1)
    assert.equal(tourReducer(1, { tipo: 'avancar' }, 3), 2)
    assert.equal(tourReducer(2, { tipo: 'avancar' }, 3), null)
  })

  it('voltar para no primeiro passo', () => {
    assert.equal(tourReducer(2, { tipo: 'voltar' }, 3), 1)
    assert.equal(tourReducer(0, { tipo: 'voltar' }, 3), 0)
  })

  it('com o tour fechado, avançar e voltar não fazem nada; encerrar sempre fecha', () => {
    assert.equal(tourReducer(null, { tipo: 'avancar' }, 3), null)
    assert.equal(tourReducer(null, { tipo: 'voltar' }, 3), null)
    assert.equal(tourReducer(1, { tipo: 'encerrar' }, 3), null)
  })
})

describe('posição do balão', () => {
  const tela = { width: 1280, height: 800 }
  const balao = { width: 320, height: 180 }

  it('item do menu lateral: à direita, centralizado na altura do item', () => {
    const posicao = posicionarBalao({ top: 200, left: 12, width: 230, height: 36 }, balao, tela)
    assert.deepEqual(posicao, { lado: 'direita', left: 254, top: 128 })
  })

  it('sem espaço à direita: abaixo, alinhado ao centro do alvo', () => {
    const posicao = posicionarBalao({ top: 100, left: 1100, width: 150, height: 40 }, balao, tela)
    assert.equal(posicao.lado, 'abaixo')
    assert.equal(posicao.top, 152)
    // Centralizado seria 1015, mas o balão não pode passar da borda direita
    assert.equal(posicao.left, 1280 - 320 - 12)
  })

  it('perto do rodapé e da direita: acima', () => {
    const posicao = posicionarBalao({ top: 700, left: 1100, width: 150, height: 40 }, balao, tela)
    assert.deepEqual(posicao, { lado: 'acima', top: 508, left: 948 })
  })

  it('item no alto do menu não deixa o balão sair por cima da tela', () => {
    assert.equal(posicionarBalao({ top: 0, left: 0, width: 200, height: 40 }, balao, tela).top, 12)
  })

  it('sem alvo, ou celular estreito sem espaço em nenhum lado: centro', () => {
    assert.deepEqual(posicionarBalao(null, balao, tela), { lado: 'centro', top: 310, left: 480 })
    const celular = { width: 360, height: 640 }
    const posicao = posicionarBalao({ top: 200, left: 20, width: 320, height: 300 }, { width: 336, height: 220 }, celular)
    assert.equal(posicao.lado, 'centro')
    assert.equal(posicao.left, 12)
  })

  it('área destacada ganha folga, mas não sai da tela', () => {
    assert.deepEqual(areaDestacada({ top: 100, left: 100, width: 50, height: 20 }, tela), { top: 94, left: 94, width: 62, height: 32 })
    assert.deepEqual(areaDestacada({ top: 0, left: 0, width: 1280, height: 40 }, tela), { top: 0, left: 0, width: 1280, height: 46 })
  })
})

describe('primeiros passos', () => {
  const nada = { contas: 0, transacoes: 0, orcamentos: 0, tourFeito: false }

  it('usuário novo: nada feito, cada item leva à página certa', () => {
    const { itens, feitos, completo } = primeirosPassos(nada)
    assert.equal(feitos, 0)
    assert.equal(completo, false)
    assert.deepEqual(
      itens.map((item) => [item.id, item.rota ?? 'tour']),
      [
        ['conta', '/contas'],
        ['transacoes', '/importar'],
        ['orcamento', '/orcamentos'],
        ['tour', 'tour'],
      ],
    )
  })

  it('marca o que o usuário já tem de verdade', () => {
    const { itens, feitos } = primeirosPassos({ ...nada, contas: 2, transacoes: 40 })
    assert.equal(feitos, 2)
    assert.deepEqual(
      itens.filter((item) => item.feito).map((item) => item.id),
      ['conta', 'transacoes'],
    )
  })

  it('tudo feito: completo', () => {
    const { feitos, total, completo } = primeirosPassos({ contas: 1, transacoes: 1, orcamentos: 1, tourFeito: true })
    assert.equal(feitos, total)
    assert.ok(completo)
  })
})
