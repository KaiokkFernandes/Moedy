import { Suspense, useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import clsx from 'clsx'
import {
  ArrowLeftRight,
  ChartPie,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Tags,
  Target,
  Upload,
  Wallet,
  WandSparkles,
  X,
} from 'lucide-react'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { TourProvider } from '@/components/onboarding/TourProvider'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { Loading } from '@/components/ui/States'
import { useAuth } from '@/hooks/useAuth'

const NAV_LINKS = [
  { to: '/', label: 'Painel', icon: LayoutDashboard },
  { to: '/transacoes', label: 'Transações', icon: ArrowLeftRight },
  { to: '/relatorios', label: 'Relatórios', icon: ChartPie },
  { to: '/orcamentos', label: 'Orçamentos', icon: Target },
  { to: '/contas', label: 'Contas', icon: Landmark },
  { to: '/categorias', label: 'Categorias', icon: Tags },
  { to: '/regras', label: 'Regras', icon: WandSparkles },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
  { to: '/importar', label: 'Importar', icon: Upload },
]

function Brand() {
  return (
    <div className="flex items-center gap-2 font-semibold text-fg">
      <span className="flex size-8 items-center justify-center rounded-lg bg-accent-soft-strong text-success">
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
    <TourProvider>
      <div className="min-h-screen bg-page md:flex">
      {/* Barra superior (só no celular) */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-surface px-4 md:hidden">
        <Brand />
        <div className="flex items-center gap-1">
          <span data-tour="notificacoes" className="inline-flex">
            <NotificationBell />
          </span>
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menu"
            aria-expanded={menuOpen}
            className="rounded-lg p-2 text-fg-2 hover:bg-subtle"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-30 bg-overlay md:hidden" onClick={() => setMenuOpen(false)} aria-hidden />
      )}

      {/* Sidebar: fixa no desktop, gaveta no celular */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-surface transition-transform duration-200',
          'md:visible md:sticky md:top-0 md:h-screen md:shrink-0 md:translate-x-0',
          menuOpen ? 'translate-x-0' : 'invisible -translate-x-full',
        )}
      >
        <div className="flex h-14 items-center justify-between px-4">
          <Brand />
          {/* No celular, o sino e o tema ficam na barra superior */}
          <div className="hidden items-center gap-1 md:flex">
            <span data-tour="notificacoes" className="inline-flex">
              <NotificationBell />
            </span>
            <ThemeToggle />
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="Fechar menu"
            className="rounded-lg p-2 text-fg-2 hover:bg-subtle md:hidden"
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
              // Âncora do tour guiado (ex.: nav-contas)
              data-tour={to === '/' ? 'nav-painel' : `nav-${to.slice(1)}`}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
                  isActive ? 'bg-accent-soft text-accent-fg' : 'text-fg-2 hover:bg-subtle hover:text-fg',
                )
              }
            >
              <Icon className="size-4.5" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-line p-3">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-medium text-fg">{user?.nome}</p>
            <p className="truncate text-xs text-fg-3">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-fg-2 hover:bg-subtle hover:text-fg"
          >
            <LogOut className="size-4.5" />
            Sair
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-4 md:p-8">
        {/* Páginas carregadas sob demanda mostram "Carregando" enquanto o código delas chega */}
        <Suspense fallback={<Loading />}>
          <Outlet />
        </Suspense>
      </main>
      </div>
    </TourProvider>
  )
}
