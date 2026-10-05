export interface User {
  id: string
  nome: string
  email: string
  createdAt: string
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
