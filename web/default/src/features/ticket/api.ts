import { api } from '@/lib/api'

// Types
export interface Ticket {
  id: number
  ticket_no: string
  user_id: number
  category: string
  priority: number
  title: string
  content: string
  attachments: string
  status: number
  assigned_to: number
  rating: number
  rating_note: string
  closed_at: string | null
  created_at: string
  updated_at: string
}

export interface TicketReply {
  id: number
  ticket_id: number
  user_id: number
  is_staff: boolean
  content: string
  attachments: string
  created_at: string
}

export interface TicketCategory {
  id: number
  name: string
  name_en: string
  description: string
  icon: string
  sort_order: number
  status: number
}

export interface CreateTicketRequest {
  category: string
  priority?: number
  title: string
  content: string
  attachments?: string
}

// API Functions
export async function getMyTickets(params?: {
  page?: number
  page_size?: number
  status?: number
}): Promise<{ success: boolean; data: { items: Ticket[]; total: number } }> {
  const res = await api.get('/api/tickets', { params })
  return res.data
}

export async function getTicketDetail(id: number): Promise<{ 
  success: boolean; 
  data: { ticket: Ticket; replies: TicketReply[] } 
}> {
  const res = await api.get(`/api/tickets/${id}`)
  return res.data
}

export async function createTicket(data: CreateTicketRequest): Promise<{ success: boolean; data: Ticket }> {
  const res = await api.post('/api/tickets', data)
  return res.data
}

export async function replyTicket(id: number, data: {
  content: string
  attachments?: string
}): Promise<{ success: boolean; data: TicketReply }> {
  const res = await api.post(`/api/tickets/${id}/reply`, data)
  return res.data
}

export async function rateTicket(id: number, data: {
  rating: number
  rating_note?: string
}): Promise<{ success: boolean; data: Ticket }> {
  const res = await api.post(`/api/tickets/${id}/rate`, data)
  return res.data
}

export async function closeTicket(id: number): Promise<{ success: boolean; data: Ticket }> {
  const res = await api.post(`/api/tickets/${id}/close`)
  return res.data
}

export async function getTicketCategories(): Promise<{ 
  success: boolean; 
  data: TicketCategory[] 
}> {
  const res = await api.get('/api/ticket/categories')
  return res.data
}
