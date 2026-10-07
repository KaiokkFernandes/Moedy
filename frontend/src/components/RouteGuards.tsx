import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

function FullScreenLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-page text-sm text-fg-3">
      Carregando…
    </div>
  )
}

/** Área logada: sem sessão, manda para /login guardando a página pedida. */
export function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <FullScreenLoading />
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  return <Outlet />
}

/** Login e cadastro: quem já está logado volta para a página pedida (ou o painel). */
export function PublicOnlyRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <FullScreenLoading />
  if (user) return <Navigate to={(location.state as { from?: string } | null)?.from ?? '/'} replace />
  return <Outlet />
}
