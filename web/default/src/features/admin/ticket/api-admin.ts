import { api } from '@/lib/api'

// Re-export types from user-facing ticket API
export type { Ticket, TicketReply, TicketCategory } from '@/features/ticket/api'

export interface AdminTicketsParams {
  page?: number
  page_size?: number
  status?: string | number
  priority?: string | number
  category?: string
  assigned_to?: string | number
  keyword?: string
}

export async function getAdminTickets(params: AdminTicketsParams): Promise<{
  success: boolean
  data: { items: import('@/features/ticket/api').Ticket[]; total: number; page: number; size: number }
}> {
  const res = await api.get('/api/admin/tickets', { params })
  return res.data
}

export async function getTicketDetail(id: number): Promise<{
  success: boolean
  data: { ticket: import('@/features/ticket/api').Ticket; replies: import('@/features/ticket/api').TicketReply[] }
}> {
  const res = await api.get(`/api/tickets/${id}`)
  return res.data
}

export async function replyTicket(id: number, data: {
  content: string
}): Promise<{ success: boolean; data: import('@/features/ticket/api').TicketReply }> {
  const res = await api.post(`/api/tickets/${id}/reply`, data)
  return res.data
}

export async function assignTicket(id: number, assignedTo: number): Promise<{ success: boolean }> {
  const res = await api.post(`/api/admin/tickets/${id}/assign`, { assigned_to: assignedTo })
  return res.data
}

export async function completeTicket(id: number): Promise<{ success: boolean }> {
  const res = await api.post(`/api/admin/tickets/${id}/complete`)
  return res.data
}

export async function adminCloseTicket(id: number, remark: string): Promise<{ success: boolean }> {
  const res = await api.post(`/api/admin/tickets/${id}/close`, { remark })
  return res.data
}
