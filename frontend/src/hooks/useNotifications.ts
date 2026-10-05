import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as notificationsService from '@/services/notifications'

/** Contador de alertas não lidos. Além das invalidações, confere de novo a cada minuto. */
export function useUnreadNotifications() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationsService.unreadCount,
    refetchInterval: 60_000,
  })
}

/** Alertas mais recentes; só busca enquanto o painel está aberto. */
export function useNotifications(enabled: boolean, pageSize = 15) {
  return useQuery({
    queryKey: ['notifications', 'list', pageSize],
    queryFn: () => notificationsService.list(pageSize),
    enabled,
  })
}

function useNotificationMutation<T>(mutationFn: (variables: T) => Promise<void>) {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }) })
}

export const useMarkNotificationRead = () => useNotificationMutation(notificationsService.markRead)
export const useMarkAllNotificationsRead = () => useNotificationMutation(notificationsService.markAllRead)
export const useDeleteNotification = () => useNotificationMutation(notificationsService.remove)
