/** Cores de categoria vêm do banco, pensadas para fundo claro. Estas funções só cuidam da exibição. */

function canais(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number]
}

function luminancia(hex: string): number {
  const [r, g, b] = canais(hex).map((valor) => {
    const c = valor / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}

export function contraste(a: string, b: string): number {
  const [clara, escura] = [luminancia(a), luminancia(b)].sort((x, y) => y - x) as [number, number]
  return (clara + 0.05) / (escura + 0.05)
}

/** Mistura `hex` com branco na proporção `t` (0 = a cor, 1 = branco). */
function clarear(hex: string, t: number): string {
  const misturados = canais(hex).map((valor) => Math.round(valor + (255 - valor) * t))
  return `#${misturados.map((valor) => valor.toString(16).padStart(2, '0')).join('')}`
}

/**
 * Cor de exibição da categoria. No modo escuro, cores escuras demais somem sobre o fundo: clareiam
 * até atingir contraste de 3:1 (o mínimo para elementos gráficos). O valor salvo não muda.
 */
export function corParaTema(hex: string, escuro: boolean, fundoEscuro = '#171a21'): string {
  if (!escuro) return hex
  let cor = hex
  for (let t = 0; t <= 1 && contraste(cor, fundoEscuro) < 3; t += 0.05) {
    cor = clarear(hex, t)
  }
  return cor
}
