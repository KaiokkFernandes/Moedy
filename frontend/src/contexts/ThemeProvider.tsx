import { useCallback, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react'
import { ThemeContext, type ChartPalette, type ThemeContextValue } from './ThemeContext'
import {
  aplicarTema,
  lerPreferencia,
  resolverTema,
  salvarPreferencia,
  sistemaPrefereEscuro,
  type Preferencia,
} from '@/lib/theme'

/** Lê as cores dos gráficos dos tokens CSS (que mudam com a classe `dark`). */
function lerPaleta(): ChartPalette {
  const estilo = getComputedStyle(document.documentElement)
  const valor = (nome: string) => estilo.getPropertyValue(`--chart-${nome}`).trim()
  return {
    receita: valor('receita'),
    despesa: valor('despesa'),
    saldo: valor('saldo'),
    contexto: valor('contexto'),
    outras: valor('outras'),
    grade: valor('grade'),
    eixo: valor('eixo'),
    cursor: valor('cursor'),
    fundo: estilo.getPropertyValue('--surface').trim(),
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preferencia, setPreferenciaState] = useState<Preferencia>(lerPreferencia)
  const [sistemaEscuro, setSistemaEscuro] = useState(sistemaPrefereEscuro)
  const tema = resolverTema(preferencia, sistemaEscuro)
  const [paleta, setPaleta] = useState<ChartPalette>(lerPaleta)

  // Acompanha o sistema operacional enquanto o app está aberto (só importa na opção "sistema")
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const midia = window.matchMedia('(prefers-color-scheme: dark)')
    const aoMudar = (evento: MediaQueryListEvent) => setSistemaEscuro(evento.matches)
    midia.addEventListener('change', aoMudar)
    return () => midia.removeEventListener('change', aoMudar)
  }, [])

  // Antes de pintar: aplica a classe e relê a paleta, para os gráficos já saírem no tema certo
  useLayoutEffect(() => {
    aplicarTema(tema)
    // A paleta vem do CSS e só pode ser lida depois que a classe do tema está na página: aqui o
    // efeito sincroniza com o DOM, que é o uso correto (calcular durante o render leria o tema velho)
    // oxlint-disable-next-line react/set-state-in-effect
    setPaleta(lerPaleta())
  }, [tema])

  const setPreferencia = useCallback((proxima: Preferencia) => {
    salvarPreferencia(proxima)
    // A transição de cores só vale para a troca feita pelo usuário (não para mudança do sistema)
    const html = document.documentElement
    html.classList.add('trocando-tema')
    window.setTimeout(() => html.classList.remove('trocando-tema'), 250)
    setPreferenciaState(proxima)
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({ preferencia, tema, escuro: tema === 'escuro', setPreferencia, paleta }),
    [preferencia, tema, setPreferencia, paleta],
  )

  return <ThemeContext value={value}>{children}</ThemeContext>
}
