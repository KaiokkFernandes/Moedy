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
