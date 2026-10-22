export interface User {
  id: string
  nome: string
  email: string
  createdAt: string
  /** Quando concluiu ou pulou o tour guiado; null = o app oferece o tour. */
  onboardingTourEm: string | null
  /** Quando ocultou o checklist de primeiros passos do Painel. */
  primeirosPassosOcultosEm: string | null
}

export interface AuthResponse {
  token: string
  user: User
}

export interface LoginData {
  email: string
  senha: string
}

export interface RegisterData extends LoginData {
  nome: string
}
