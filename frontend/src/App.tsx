import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/AppLayout'
import { ProtectedRoute, PublicOnlyRoute } from '@/components/RouteGuards'
import { Categorias } from '@/pages/Categorias'
import { Contas } from '@/pages/Contas'
import { Importar } from '@/pages/Importar'
import { Login } from '@/pages/Login'
import { Orcamentos } from '@/pages/Orcamentos'
import { Painel } from '@/pages/Painel'
import { Register } from '@/pages/Register'
import { Regras } from '@/pages/Regras'
import { Relatorios } from '@/pages/Relatorios'
import { Transacoes } from '@/pages/Transacoes'

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
