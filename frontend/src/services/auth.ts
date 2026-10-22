import { api } from '@/lib/api'
import type { AuthResponse, LoginData, RegisterData, User } from '@/types/auth'

export async function login(data: LoginData) {
  return (await api.post<AuthResponse>('/auth/login', data)).data
}

export async function register(data: RegisterData) {
  return (await api.post<AuthResponse>('/auth/register', data)).data
}

export async function me() {
  return (await api.get<{ user: User }>('/auth/me')).data.user
}

export async function google(credential: string) {
  return (await api.post<AuthResponse>('/auth/google', { credential })).data
}

/**
 * Configuração pública da autenticação: se o cadastro de novos usuários está aberto e o Client ID
 * do Google (null quando o login com Google não está configurado no servidor).
 */
export async function config() {
  return (await api.get<{ registrationEnabled: boolean; googleClientId: string | null }>('/auth/config')).data
}
