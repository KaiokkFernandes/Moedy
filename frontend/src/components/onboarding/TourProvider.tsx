import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { TourContext, type TourContextValue } from '@/contexts/TourContext'
import { useAuth } from '@/hooks/useAuth'
import { useAtualizarOnboarding } from '@/hooks/useOnboarding'
import { PASSOS_TOUR, tourReducer, type AcaoTour, type EstadoTour } from '@/lib/onboarding/passos'
import { BoasVindas } from './BoasVindas'
import { TourGuiado } from './TourGuiado'

/**
 * Controla o tour guiado da área logada: oferece o tour no primeiro acesso (boas-vindas), mostra
 * os passos e registra no servidor quando o usuário conclui ou pula, para não oferecer de novo.
 */
export function TourProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { mutate: salvar } = useAtualizarOnboarding()
  const [indice, despachar] = useReducer((estado: EstadoTour, acao: AcaoTour) => tourReducer(estado, acao), null)
  const [convidou, setConvidou] = useState(false)
  const aberto = useRef(false)

  const iniciarTour = useCallback(() => {
    setConvidou(true)
    despachar({ tipo: 'iniciar' })
  }, [])
  const avancar = useCallback(() => despachar({ tipo: 'avancar' }), [])
  const voltar = useCallback(() => despachar({ tipo: 'voltar' }), [])
  const encerrar = useCallback(() => despachar({ tipo: 'encerrar' }), [])
  const comecar = useCallback(() => {
    despachar({ tipo: 'encerrar' })
    navigate('/contas')
  }, [navigate])

  // Ao fechar o tour (concluído ou pulado), grava uma vez; refazer pelas configurações não grava de novo
  useEffect(() => {
    if (indice !== null) {
      aberto.current = true
      return
    }
    if (aberto.current && user && !user.onboardingTourEm) salvar({ tourConcluido: true })
    aberto.current = false
  }, [indice, user, salvar])

  const agoraNao = useCallback(() => {
    setConvidou(true)
    salvar({ tourConcluido: true })
  }, [salvar])

  const value = useMemo<TourContextValue>(() => ({ ativo: indice !== null, iniciarTour }), [indice, iniciarTour])
  const passo = indice === null ? undefined : PASSOS_TOUR[indice]

  return (
    <TourContext value={value}>
      {children}
      <BoasVindas
        aberto={Boolean(user && !user.onboardingTourEm && !convidou && indice === null)}
        nome={user?.nome ?? ''}
        onFazerTour={iniciarTour}
        onAgoraNao={agoraNao}
      />
      {passo && indice !== null && (
        <TourGuiado
          key={passo.id}
          passo={passo}
          indice={indice}
          total={PASSOS_TOUR.length}
          onAvancar={avancar}
          onVoltar={voltar}
          onEncerrar={encerrar}
          onComecar={comecar}
        />
      )}
    </TourContext>
  )
}
