import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/AppLayout'
import { FullScreenLoading } from '@/components/FullScreenLoading'
import { ProtectedRoute, PublicOnlyRoute } from '@/components/RouteGuards'

// Cada página é um arquivo separado no build, baixado só quando a rota é aberta. Assim o login
// não carrega o código das outras telas, e a biblioteca de gráficos só vem com o Painel e os
// Relatórios.
const Login = lazy(() => import('@/pages/Login').then((m) => ({ default: m.Login })))
const Register = lazy(() => import('@/pages/Register').then((m) => ({ default: m.Register })))
const Painel = lazy(() => import('@/pages/Painel').then((m) => ({ default: m.Painel })))
const Transacoes = lazy(() => import('@/pages/Transacoes').then((m) => ({ default: m.Transacoes })))
const Relatorios = lazy(() => import('@/pages/Relatorios').then((m) => ({ default: m.Relatorios })))
const Orcamentos = lazy(() => import('@/pages/Orcamentos').then((m) => ({ default: m.Orcamentos })))
const Contas = lazy(() => import('@/pages/Contas').then((m) => ({ default: m.Contas })))
const Categorias = lazy(() => import('@/pages/Categorias').then((m) => ({ default: m.Categorias })))
const Regras = lazy(() => import('@/pages/Regras').then((m) => ({ default: m.Regras })))
const Configuracoes = lazy(() => import('@/pages/Configuracoes').then((m) => ({ default: m.Configuracoes })))
const NaoEncontrada = lazy(() => import('@/pages/NaoEncontrada').then((m) => ({ default: m.NaoEncontrada })))
const Importar = lazy(() => import('@/pages/Importar').then((m) => ({ default: m.Importar })))

export default function App() {
  return (
    // Para as páginas fora do layout (login e cadastro); as da área logada usam o Suspense do
    // AppLayout, que mantém a barra lateral na tela enquanto a página chega
    <Suspense fallback={<FullScreenLoading />}>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Register />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Painel />} />
            <Route path="/transacoes" element={<Transacoes />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/orcamentos" element={<Orcamentos />} />
            <Route path="/contas" element={<Contas />} />
            <Route path="/categorias" element={<Categorias />} />
            <Route path="/regras" element={<Regras />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="/importar" element={<Importar />} />
          </Route>
        </Route>

        <Route path="*" element={<NaoEncontrada />} />
      </Routes>
    </Suspense>
  )
}
