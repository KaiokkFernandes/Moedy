import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useGoogleClientId } from '@/hooks/useRegistrationEnabled'
import { useTheme } from '@/hooks/useTheme'
import { getErrorMessage } from '@/lib/api'
import { carregarGoogleIdentity } from '@/lib/googleIdentity'

interface GoogleButtonProps {
  /** Texto do botão: "Fazer login com o Google" ou "Inscrever-se com o Google". */
  texto: 'signin_with' | 'signup_with'
  onErro: (mensagem: string) => void
  onCarregando: (carregando: boolean) => void
}

/**
 * Botão oficial do Google, seguido de um divisor "ou". Só aparece quando o servidor tem o login
 * com Google configurado. O Google entrega um token ao navegador, e o backend o confere antes de
 * abrir a sessão.
 */
export function GoogleButton({ texto, onErro, onCarregando }: GoogleButtonProps) {
  const clientId = useGoogleClientId()
  const { loginWithGoogle } = useAuth()
  const { escuro } = useTheme()
  const container = useRef<HTMLDivElement>(null)
  const [indisponivel, setIndisponivel] = useState(false)
  // Os callbacks mudam a cada render; o botão do Google guarda o primeiro que recebe
  const acoes = useRef({ loginWithGoogle, onErro, onCarregando })
  useEffect(() => {
    acoes.current = { loginWithGoogle, onErro, onCarregando }
  })

  useEffect(() => {
    const elemento = container.current
    if (!clientId || !elemento) return
    let ativo = true

    carregarGoogleIdentity()
      .then((google) => {
        if (!ativo) return
        google.initialize({
          client_id: clientId,
          ux_mode: 'popup',
          context: texto === 'signup_with' ? 'signup' : 'signin',
          callback: async ({ credential }) => {
            const { loginWithGoogle, onErro, onCarregando } = acoes.current
            onErro('')
            onCarregando(true)
            try {
              // Com a sessão iniciada, o PublicOnlyRoute leva para a área logada
              await loginWithGoogle(credential)
            } catch (error) {
              onErro(getErrorMessage(error, 'Não foi possível entrar com o Google. Tente novamente.'))
              onCarregando(false)
            }
          },
        })
        elemento.replaceChildren()
        google.renderButton(elemento, {
          type: 'standard',
          theme: escuro ? 'filled_black' : 'outline',
          size: 'large',
          text: texto,
          shape: 'rectangular',
          logo_alignment: 'center',
          width: Math.min(400, Math.max(200, Math.round(elemento.clientWidth))),
          locale: 'pt-BR',
        })
      })
      .catch(() => {
        if (ativo) setIndisponivel(true)
      })

    return () => {
      ativo = false
    }
  }, [clientId, escuro, texto])

  if (!clientId || indisponivel) return null

  return (
    <div className="space-y-4">
      {/* Altura fixa: o botão do Google é desenhado depois que o script carrega */}
      <div ref={container} className="flex h-11 w-full justify-center" />
      <div className="flex items-center gap-3 text-xs text-fg-3" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        ou
        <span className="h-px flex-1 bg-line" />
      </div>
    </div>
  )
}
