import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import clsx from 'clsx'
import {
  ArrowLeftRight,
  ChartPie,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  Tags,
  Target,
  Upload,
  Wallet,
  X,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const NAV_LINKS = [
  { to: '/', label: 'Painel', icon: LayoutDashboard },
  { to: '/transacoes', label: 'Transações', icon: ArrowLeftRight },
  { to: '/relatorios', label: 'Relatórios', icon: ChartPie },
  { to: '/orcamentos', label: 'Orçamentos', icon: Target },
  { to: '/contas', label: 'Contas', icon: Landmark },
  { to: '/categorias', label: 'Categorias', icon: Tags },
  { to: '/importar', label: 'Importar', icon: Upload },
]

function Brand() {
  return (
    <div className="flex items-center gap-2 font-semibold text-slate-900">
      <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
        <Wallet className="size-4" />
      </span>
      Finanças
    </div>
  )
}

export function AppLayout() {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!menuOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      {/* Barra superior (só no celular) */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden">
        <Brand />
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Abrir menu"
          aria-expanded={menuOpen}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
        >
          <Menu className="size-5" />
        </button>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-30 bg-slate-900/40 md:hidden" onClick={() => setMenuOpen(false)} aria-hidden />
      )}

      {/* Sidebar: fixa no desktop, gaveta no celular */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200',
          'md:visible md:sticky md:top-0 md:h-screen md:shrink-0 md:translate-x-0',
          menuOpen ? 'translate-x-0' : 'invisible -translate-x-full',
        )}
      >
        <div className="flex h-14 items-center justify-between px-4">
          <Brand />
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="Fechar menu"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {NAV_LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
                  isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )
              }
            >
              <Icon className="size-4.5" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-3">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-medium text-slate-900">{user?.nome}</p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            <LogOut className="size-4.5" />
            Sair
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  )
}
