export interface Retangulo {
  top: number
  left: number
  width: number
  height: number
}

export type Lado = 'direita' | 'abaixo' | 'acima' | 'esquerda' | 'centro'

export interface PosicaoBalao {
  top: number
  left: number
  lado: Lado
}

const limitar = (valor: number, minimo: number, maximo: number) => Math.min(Math.max(valor, minimo), Math.max(minimo, maximo))

/**
 * Onde colocar o balão do tour em relação ao elemento destacado. Tenta, nesta ordem: à direita
 * (itens do menu lateral), abaixo, acima e à esquerda; usa o primeiro lado em que o balão cabe
 * inteiro na tela. Sem alvo, ou se não couber em nenhum lado, o balão vai para o centro.
 * O resultado nunca sai da tela (respeita a margem).
 */
export function posicionarBalao(
  alvo: Retangulo | null,
  balao: { width: number; height: number },
  tela: { width: number; height: number },
  { margem = 12, distancia = 12 } = {},
): PosicaoBalao {
  const centro: PosicaoBalao = {
    top: limitar((tela.height - balao.height) / 2, margem, tela.height - balao.height - margem),
    left: limitar((tela.width - balao.width) / 2, margem, tela.width - balao.width - margem),
    lado: 'centro',
  }
  if (!alvo) return centro

  const direita = alvo.left + alvo.width
  const baixo = alvo.top + alvo.height
  const cabeHorizontal = (left: number) => left >= margem && left + balao.width <= tela.width - margem
  const cabeVertical = (top: number) => top >= margem && top + balao.height <= tela.height - margem
  // Centraliza o balão no alvo, mas sem sair da tela
  const topAlinhado = limitar(alvo.top + alvo.height / 2 - balao.height / 2, margem, tela.height - balao.height - margem)
  const leftAlinhado = limitar(alvo.left + alvo.width / 2 - balao.width / 2, margem, tela.width - balao.width - margem)

  const opcoes: PosicaoBalao[] = [
    { lado: 'direita', left: direita + distancia, top: topAlinhado },
    { lado: 'abaixo', top: baixo + distancia, left: leftAlinhado },
    { lado: 'acima', top: alvo.top - distancia - balao.height, left: leftAlinhado },
    { lado: 'esquerda', left: alvo.left - distancia - balao.width, top: topAlinhado },
  ]
  return opcoes.find((opcao) => cabeHorizontal(opcao.left) && cabeVertical(opcao.top)) ?? centro
}

/** Área destacada: o retângulo do alvo com uma folga, sem passar das bordas da tela. */
export function areaDestacada(alvo: Retangulo, tela: { width: number; height: number }, folga = 6): Retangulo {
  const left = Math.max(0, alvo.left - folga)
  const top = Math.max(0, alvo.top - folga)
  return {
    left,
    top,
    width: Math.min(tela.width, alvo.left + alvo.width + folga) - left,
    height: Math.min(tela.height, alvo.top + alvo.height + folga) - top,
  }
}
