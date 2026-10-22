import { useMutation } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import * as onboardingService from '@/services/onboarding'
import type { OnboardingInput } from '@/services/onboarding'

/**
 * Salva o andamento do onboarding. A tela muda na hora (o checklist some, o convite do tour não
 * volta) e, se o servidor recusar, volta ao estado anterior.
 */
export function useAtualizarOnboarding() {
  const { user, atualizarUsuario } = useAuth()

  return useMutation({
    mutationFn: onboardingService.atualizar,
    onMutate: (input: OnboardingInput) => {
      const anterior = { onboardingTourEm: user?.onboardingTourEm ?? null, primeirosPassosOcultosEm: user?.primeirosPassosOcultosEm ?? null }
      const agora = new Date().toISOString()
      atualizarUsuario({
        ...(input.tourConcluido !== undefined && { onboardingTourEm: input.tourConcluido ? agora : null }),
        ...(input.primeirosPassosOcultos !== undefined && { primeirosPassosOcultosEm: input.primeirosPassosOcultos ? agora : null }),
      })
      return anterior
    },
    onSuccess: (estado) => atualizarUsuario(estado),
    onError: (_erro, _input, anterior) => {
      if (anterior) atualizarUsuario(anterior)
    },
  })
}
