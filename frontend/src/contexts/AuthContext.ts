import { createContext } from 'react'
import type { LoginData, RegisterData, User } from '@/types/auth'

export interface AuthContextValue {
  user: User | null
  /** true enquanto a sessão salva ainda está sendo verificada ao abrir o app. */
  loading: boolean
  login: (data: LoginData) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
