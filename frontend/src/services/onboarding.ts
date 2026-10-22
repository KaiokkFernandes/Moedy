import { api } from '@/lib/api'

export interface OnboardingInput {
  tourConcluido?: boolean
  primeirosPassosOcultos?: boolean
}

export interface OnboardingEstado {
  onboardingTourEm: string | null
  primeirosPassosOcultosEm: string | null
}

export async function atualizar(input: OnboardingInput) {
  return (await api.put<OnboardingEstado>('/settings/onboarding', input)).data
}
