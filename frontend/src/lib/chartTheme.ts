import type { ChartPalette } from '@/contexts/ThemeContext'

/** Ticks dos eixos com a cor de texto secundário do tema atual. */
export function axisTick(cores: ChartPalette) {
  return { fill: cores.eixo, fontSize: 12 }
}
