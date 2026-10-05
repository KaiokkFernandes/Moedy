import { lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/AppLayout'
import { ProtectedRoute, PublicOnlyRoute } from '@/components/RouteGuards'
import { Categorias } from '@/pages/Categorias'
import { Contas } from '@/pages/Contas'
import { Importar } from '@/pages/Importar'
import { Login } from '@/pages/Login'
import { Orcamentos } from '@/pages/Orcamentos'
import { Register } from '@/pages/Register'
import { Regras } from '@/pages/Regras'
import { Transacoes } from '@/pages/Transacoes'

// As páginas com gráficos trazem a biblioteca de gráficos junto; carregadas sob demanda,
// o login e as demais telas não precisam baixar esse código.
const Painel = lazy(() => import('@/pages/Painel').then((module) => ({ default: module.Painel })))
const Relatorios = lazy(() => import('@/pages/Relatorios').then((module) => ({ default: module.Relatorios })))

export default function App() {
  return (
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
          <Route path="/importar" element={<Importar />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
