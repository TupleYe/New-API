import { api } from '@/lib/api'

// Types
export interface Message {
  id: number
  user_id: number
  title: string
  content: string
  type: string
  link: string
  is_read: boolean
  read_at: string | null
  created_at: string
}

// API Functions
export async function getMyMessages(params?: {
  page?: number
  page_size?: number
  is_read?: boolean
  type?: string
}): Promise<{ success: boolean; data: { items: Message[]; total: number } }> {
  const res = await api.get('/api/messages', { params })
  return res.data
}

export async function getUnreadCount(): Promise<{ success: boolean; data: { unread_count: number } }> {
  const res = await api.get('/api/messages/unread')
  return res.data
}

export async function markAsRead(id: number): Promise<{ success: boolean; data: Message }> {
  const res = await api.post(`/api/messages/${id}/read`)
  return res.data
}

export async function markAllAsRead(): Promise<{ success: boolean; data: { message: string } }> {
  const res = await api.post('/api/messages/read/all')
  return res.data
}

export async function deleteMessage(id: number): Promise<{ success: boolean; data: { message: string } }> {
  const res = await api.delete(`/api/messages/${id}`)
  return res.data
}
