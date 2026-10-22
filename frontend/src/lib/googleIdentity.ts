/** Partes da biblioteca Google Identity Services (accounts.google.com/gsi/client) usadas pelo app. */
export interface GoogleIdentity {
  initialize: (opcoes: {
    client_id: string
    callback: (resposta: { credential: string }) => void
    ux_mode?: 'popup' | 'redirect'
    context?: 'signin' | 'signup' | 'use'
  }) => void
  renderButton: (
    elemento: HTMLElement,
    opcoes: {
      type?: 'standard' | 'icon'
      theme?: 'outline' | 'filled_blue' | 'filled_black'
      size?: 'large' | 'medium' | 'small'
      text?: 'signin_with' | 'signup_with' | 'continue_with'
      shape?: 'rectangular' | 'pill'
      logo_alignment?: 'left' | 'center'
      width?: number
      locale?: string
    },
  ) => void
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdentity } }
  }
}

const SCRIPT = 'https://accounts.google.com/gsi/client'
let carregando: Promise<GoogleIdentity> | null = null

/** Carrega o script do Google uma única vez, só nas telas que mostram o botão. */
export function carregarGoogleIdentity(): Promise<GoogleIdentity> {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id)
  carregando ??= new Promise<GoogleIdentity>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT
    script.async = true
    script.onload = () => (window.google?.accounts?.id ? resolve(window.google.accounts.id) : reject(new Error('Google Identity indisponível')))
    script.onerror = () => {
      // Permite tentar de novo depois (ex.: estava sem internet)
      carregando = null
      script.remove()
      reject(new Error('Não foi possível carregar o login com Google'))
    }
    document.head.append(script)
  })
  return carregando
}
