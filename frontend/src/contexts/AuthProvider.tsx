import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { setUnauthorizedHandler, tokenStorage } from '@/lib/api'
import * as authService from '@/services/auth'
import type { AuthResponse, LoginData, RegisterData, User } from '@/types/auth'
import { AuthContext, type AuthContextValue } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(() => tokenStorage.get() !== null)

  const logout = useCallback(() => {
    tokenStorage.clear()
    setUser(null)
    // Dados em cache pertencem ao usuário que saiu
    queryClient.clear()
  }, [queryClient])

  const startSession = useCallback(({ token, user }: AuthResponse) => {
    tokenStorage.set(token)
    setUser(user)
  }, [])

  const login = useCallback(
    async (data: LoginData) => startSession(await authService.login(data)),
    [startSession],
  )

  const register = useCallback(
    async (data: RegisterData) => startSession(await authService.register(data)),
    [startSession],
  )

  useEffect(() => {
    setUnauthorizedHandler(logout)
    return () => setUnauthorizedHandler(() => {})
  }, [logout])

  // Ao abrir o app com um token salvo, busca o usuário. Se o token for inválido,
  // o interceptor do axios (401) já encerra a sessão.
  useEffect(() => {
    if (!tokenStorage.get()) return

    let cancelled = false
    authService
      .me()
      .then((user) => {
        if (!cancelled) setUser(user)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
