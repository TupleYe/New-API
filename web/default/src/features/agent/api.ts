import { api } from '@/lib/api'

// Types
export interface Agent {
  id: number
  user_id: number
  parent_id: number
  agent_level: number
  commission_rate: number
  total_commission: number
  pending_commission: number
  withdrawn_amount: number
  status: number
  invite_code: string
  invite_url: string
  created_at: string
  updated_at: string
}

export interface AgentStats {
  total_commission: number
  pending_commission: number
  withdrawn_amount: number
  invited_users: number
  today_commission: number
  month_commission: number
  agent_level: number
  commission_rate: number
}

export interface AgentCommission {
  id: number
  agent_id: number
  user_id: number
  order_id: string
  order_amount: number
  commission: number
  commission_type: number
  status: number
  settled_at: string | null
  created_at: string
}

export interface AgentWithdrawal {
  id: number
  agent_id: number
  amount: number
  fee: number
  actual_amount: number
  method: string
  account: string
  account_name: string
  bank_name: string
  status: number
  remark: string
  processed_at: string | null
  created_at: string
}

// API Functions
export async function getAgentInfo(): Promise<{ success: boolean; data: Agent | null }> {
  const res = await api.get('/api/agent')
  return res.data
}

export async function applyForAgent(): Promise<{ success: boolean; data: Agent }> {
  const res = await api.post('/api/agent/apply')
  return res.data
}

export async function getAgentStats(): Promise<{ success: boolean; data: AgentStats }> {
  const res = await api.get('/api/agent/stats')
  return res.data
}

export async function getAgentCommissions(params?: {
  page?: number
  page_size?: number
  status?: number
}): Promise<{ success: boolean; data: { items: AgentCommission[]; total: number } }> {
  const res = await api.get('/api/agent/commissions', { params })
  return res.data
}

export async function getAgentWithdrawals(params?: {
  page?: number
  page_size?: number
  status?: number
}): Promise<{ success: boolean; data: { items: AgentWithdrawal[]; total: number } }> {
  const res = await api.get('/api/agent/withdrawals', { params })
  return res.data
}

export async function requestWithdrawal(data: {
  amount: number
  method: string
  account: string
  account_name?: string
  bank_name?: string
}): Promise<{ success: boolean; data: AgentWithdrawal }> {
  const res = await api.post('/api/agent/withdraw', data)
  return res.data
}

export async function getInvitedUsers(): Promise<{ success: boolean; data: any[] }> {
  const res = await api.get('/api/agent/invited')
  return res.data
}
