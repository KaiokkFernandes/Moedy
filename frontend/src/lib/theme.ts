/*
 * Tema do app: preferência salva (claro, escuro ou sistema), tema efetivo e aplicação no documento.
 * O script do index.html replica `resolverTema` e `aplicarTema` para o primeiro desenho.
 */

export const TEMAS = ['claro', 'escuro', 'sistema'] as const
export type Preferencia = (typeof TEMAS)[number]
export type TemaEfetivo = 'claro' | 'escuro'

export const TEMA_LABEL: Record<Preferencia, string> = {
  claro: 'Claro',
  escuro: 'Escuro',
  sistema: 'Sistema',
}

const STORAGE_KEY = 'financas:tema'
const META_THEME_COLOR: Record<TemaEfetivo, string> = { claro: '#f8fafc', escuro: '#0f1115' }

/** Quem nunca escolheu segue o sistema. Localstorage bloqueado também cai aqui. */
export function lerPreferencia(): Preferencia {
  try {
    const valor = localStorage.getItem(STORAGE_KEY)
    if (valor === 'claro' || valor === 'escuro' || valor === 'sistema') return valor
  } catch {
    // Sem acesso ao armazenamento, vale o padrão
  }
  return 'sistema'
}

export function salvarPreferencia(preferencia: Preferencia) {
  try {
    localStorage.setItem(STORAGE_KEY, preferencia)
  } catch {
    // A escolha vale só nesta página
  }
}

export function sistemaPrefereEscuro(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false
}

export function resolverTema(preferencia: Preferencia, sistemaEscuro: boolean): TemaEfetivo {
  if (preferencia === 'escuro') return 'escuro'
  if (preferencia === 'claro') return 'claro'
  return sistemaEscuro ? 'escuro' : 'claro'
}

/** Põe a classe `dark` no <html>, o color-scheme (barras de rolagem, campos nativos) e a cor da barra do navegador. */
export function aplicarTema(tema: TemaEfetivo) {
  const html = document.documentElement
  html.classList.toggle('dark', tema === 'escuro')
  html.style.colorScheme = tema === 'escuro' ? 'dark' : 'light'
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', META_THEME_COLOR[tema])
}
