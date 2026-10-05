import { api } from '@/lib/api'
import type { NotificationList } from '@/types/budgets'

export async function list(pageSize: number) {
  return (await api.get<NotificationList>('/notifications', { params: { pageSize } })).data
}

export async function unreadCount() {
  return (await api.get<{ total: number }>('/notifications/unread-count')).data.total
}

export async function markRead(id: string) {
  await api.patch(`/notifications/${id}/read`)
}

export async function markAllRead() {
  await api.post('/notifications/read-all')
}

export async function remove(id: string) {
  await api.delete(`/notifications/${id}`)
}
