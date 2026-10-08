import axios from 'axios'

const TOKEN_KEY = 'financas:token'

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

/**
 * Endereço do backend, definido no build por VITE_API_URL (ex.: https://minha-api.onrender.com).
 * Vazio em desenvolvimento: as chamadas vão para /api na mesma origem, e o proxy do Vite as
 * encaminha para o backend local.
 */
const API_URL = (import.meta.env.VITE_API_URL ?? '').trim().replace(/\/+$/, '')

export const api = axios.create({
  baseURL: `${API_URL}/api`,
})

let onUnauthorized = () => {}

/** Registrado pelo AuthProvider para encerrar a sessão quando a API responde 401. */
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler
}

api.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Só encerra a sessão se a requisição foi feita com token; um 401 no login
    // (senha errada) deve apenas mostrar o erro no formulário.
    if (axios.isAxiosError(error) && error.response?.status === 401 && error.config?.headers.Authorization) {
      tokenStorage.clear()
      onUnauthorized()
    }
    return Promise.reject(error)
  },
)

interface ApiErrorBody {
  error?: string
  issues?: { campo: string; mensagem: string }[]
}

/** Mensagem de erro da API (em português) ou um texto padrão se o servidor não respondeu. */
export function getErrorMessage(error: unknown, fallback = 'Algo deu errado. Tente novamente.') {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    if (!error.response) return 'Não foi possível conectar ao servidor.'
    return error.response.data?.error ?? fallback
  }
  return fallback
}

/** Erros de validação por campo devolvidos pela API (resposta 400). */
export function getFieldErrors(error: unknown): Record<string, string> {
  if (!axios.isAxiosError<ApiErrorBody>(error)) return {}
  const issues = error.response?.data?.issues ?? []
  return Object.fromEntries(issues.map((issue) => [issue.campo, issue.mensagem]))
}
