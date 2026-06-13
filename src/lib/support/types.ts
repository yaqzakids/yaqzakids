import type { SupportCategory, SupportPriority, SupportSenderType, SupportStatus } from '@/lib/support/constants'

export interface SupportTicketRow {
  id: string
  ticket_number: string
  parent_id: string
  subject: string
  category: SupportCategory | string
  priority: SupportPriority | string
  message: string
  status: SupportStatus | string
  assigned_to: string | null
  attachment_url: string | null
  admin_reply: string | null
  admin_notes: string | null
  created_at: string
  updated_at: string
}

export interface SupportMessageRow {
  id: string
  ticket_id: string
  sender_id: string | null
  sender_type: SupportSenderType
  message: string
  is_internal: boolean
  attachment_url: string | null
  created_at: string
  sender?: { full_name: string; email: string | null } | null
}

export interface SupportTicketSummary extends SupportTicketRow {
  last_reply_at: string | null
}

export interface SupportTicketDetail extends SupportTicketRow {
  messages: SupportMessageRow[]
  parent?: { full_name: string; email: string | null } | null
  assignee?: { full_name: string; email: string | null } | null
  refund_requests?: SupportRefundRequestRow[]
}

export interface SupportRefundRequestRow {
  id: string
  ticket_id: string
  amount: number
  reason: string
  requested_by: string | null
  status: string
  created_at: string
  updated_at: string
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export interface CreateSupportTicketInput {
  subject: string
  category: SupportCategory
  priority: SupportPriority
  message: string
  attachmentUrl?: string | null
}

export interface SupportTicketFilters {
  status?: string
  category?: string
  priority?: string
  search?: string
  page?: number
  pageSize?: number
}

export interface SupportKpis {
  open: number
  pending: number
  resolved: number
  highPriority: number
}
