import { useQuery } from '@tanstack/react-query'
import * as authService from '@/services/auth'

/**
 * Se o cadastro de novos usuários está aberto no servidor. Enquanto não se sabe (carregando ou
 * servidor fora do ar), vale `true`: o próprio servidor recusa o cadastro quando está desligado.
 */
export function useRegistrationEnabled() {
  const config = useQuery({ queryKey: ['auth-config'], queryFn: authService.config, staleTime: 5 * 60 * 1000, retry: false })
  return config.data?.registrationEnabled ?? true
}
