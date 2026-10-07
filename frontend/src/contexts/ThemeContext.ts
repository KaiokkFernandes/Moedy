import { createContext } from 'react'
import type { Preferencia, TemaEfetivo } from '@/lib/theme'

export interface ChartPalette {
  receita: string
  despesa: string
  saldo: string
  contexto: string
  outras: string
  grade: string
  eixo: string
  cursor: string
  /** Cor de superfície, para contornos (ex.: pontos das linhas). */
  fundo: string
}

export interface ThemeContextValue {
  /** O que o usuário escolheu (inclui "sistema"). */
  preferencia: Preferencia
  /** O tema que está valendo agora. */
  tema: TemaEfetivo
  escuro: boolean
  setPreferencia: (preferencia: Preferencia) => void
  /** Cores dos gráficos no tema atual, lidas dos tokens CSS. */
  paleta: ChartPalette
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)
