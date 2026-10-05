import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { Bell, Check, CircleAlert, Receipt, Repeat, TrendingUp, TriangleAlert, X, type LucideIcon } from 'lucide-react'
import { IconButton } from '@/components/ui/Button'
import {
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotifications,
} from '@/hooks/useNotifications'
import { getErrorMessage } from '@/lib/api'
import { formatRelativeTime } from '@/lib/format'
import type { AppNotification, NotificationType } from '@/types/budgets'

const ICONS: Record<NotificationType, { icon: LucideIcon; className: string }> = {
  ORCAMENTO_ATENCAO: { icon: TriangleAlert, className: 'bg-amber-100 text-amber-700' },
  ORCAMENTO_ESTOURADO: { icon: CircleAlert, className: 'bg-red-100 text-red-700' },
  ORCAMENTO_PROJECAO: { icon: TrendingUp, className: 'bg-amber-100 text-amber-700' },
  DESPESA_ATIPICA: { icon: Receipt, className: 'bg-violet-100 text-violet-700' },
  RECORRENTE_NOVA: { icon: Repeat, className: 'bg-sky-100 text-sky-700' },
  RECORRENTE_VALOR: { icon: Repeat, className: 'bg-sky-100 text-sky-700' },
}

/** Sino com o contador de alertas não lidos e o painel suspenso com os alertas recentes. */
export function NotificationBell() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const container = useRef<HTMLDivElement>(null)

  const unread = useUnreadNotifications()
  const notifications = useNotifications(open)
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()
  const deleteNotification = useDeleteNotification()

  // Fecha ao clicar fora ou apertar Esc
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function openNotification(notification: AppNotification) {
    if (!notification.lida) markRead.mutate(notification.id)
    setOpen(false)
    if (notification.link) navigate(notification.link)
  }

  const count = unread.data ?? 0
  const items = notifications.data?.itens ?? []

  return (
    <div ref={container} className="relative">
      <button
        type="button"
        aria-label={count === 0 ? 'Alertas' : count === 1 ? 'Alertas (1 não lido)' : `Alertas (${count} não lidos)`}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
        className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
      >
        <Bell className="size-5" aria-hidden />
        {count > 0 && (
          <span
            aria-hidden
            className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] leading-none font-semibold text-white ring-2 ring-white"
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Alertas"
          // No celular, o painel ocupa a largura da tela logo abaixo da barra superior; no desktop,
          // abre abaixo do sino (que fica no topo da barra lateral)
          className="fixed inset-x-4 top-16 z-50 flex max-h-[min(32rem,calc(100dvh-5rem))] flex-col rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 md:absolute md:inset-x-auto md:top-full md:left-0 md:mt-2 md:w-88"
        >
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
            <h2 className="font-medium text-slate-900">Alertas</h2>
            {count > 0 && (
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                className="rounded text-sm font-medium text-emerald-700 hover:underline focus-visible:outline-2 focus-visible:outline-slate-400 disabled:opacity-60"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          {notifications.isPending ? (
            <p role="status" className="px-4 py-8 text-center text-sm text-slate-500">
              Carregando…
            </p>
          ) : notifications.isError ? (
            <p role="alert" className="px-4 py-8 text-center text-sm text-red-700">
              {getErrorMessage(notifications.error, 'Não foi possível carregar os alertas.')}
            </p>
          ) : items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">
              Nenhum alerta por aqui. Avisamos quando um orçamento chegar perto do limite ou algo fugir do normal.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 overflow-y-auto">
              {items.map((notification) => {
                const { icon: Icon, className } = ICONS[notification.tipo]
                return (
                  <li key={notification.id} className={clsx('flex items-start gap-1 py-2 pr-2 pl-4', !notification.lida && 'bg-emerald-50/60')}>
                    <button
                      type="button"
                      onClick={() => openNotification(notification)}
                      className="flex min-w-0 flex-1 items-start gap-3 rounded-lg py-1 text-left focus-visible:outline-2 focus-visible:outline-slate-400"
                    >
                      <span className={clsx('mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full', className)}>
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={clsx('block text-sm text-slate-900', notification.lida ? 'font-medium' : 'font-semibold')}>
                          {!notification.lida && <span className="sr-only">Não lido: </span>}
                          {notification.titulo}
                        </span>
                        <span className="mt-0.5 block text-sm text-slate-600">{notification.mensagem}</span>
                        <span className="mt-1 block text-xs text-slate-500">{formatRelativeTime(notification.createdAt)}</span>
                      </span>
                    </button>
                    <div className="flex shrink-0 flex-col">
                      {!notification.lida && (
                        <IconButton label={`Marcar como lido: ${notification.titulo}`} onClick={() => markRead.mutate(notification.id)} className="p-1.5">
                          <Check className="size-4" />
                        </IconButton>
                      )}
                      <IconButton label={`Excluir alerta: ${notification.titulo}`} onClick={() => deleteNotification.mutate(notification.id)} className="p-1.5">
                        <X className="size-4" />
                      </IconButton>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
