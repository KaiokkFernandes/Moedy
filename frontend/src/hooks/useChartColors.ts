import type { ChartPalette } from '@/contexts/ThemeContext'
import { useTheme } from './useTheme'

/** Cores dos gráficos no tema atual (lidas dos tokens CSS). Mudam ao trocar o tema, sem recarregar. */
export function useChartColors(): ChartPalette {
  return useTheme().paleta
}
