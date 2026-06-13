import { supabase } from '@/lib/supabase'
import { logAdminAction } from '@/lib/admin/activity'
import type {
  PaginatedResult,
  SupportKpis,
  SupportMessageRow,
  SupportRefundRequestRow,
  SupportTicketDetail,
  SupportTicketFilters,
  SupportTicketRow,
} from '@/lib/support/types'

export interface AdminSupportTicket extends SupportTicketRow {
  parent?: { full_name: string; email: string | null } | null
  assignee?: { full_name: string; email: string | null } | null
  last_reply_at?: string | null
}

async function enqueueNotification(
  eventType: 'ticket_created' | 'admin_replied' | 'ticket_resolved',
  ticketId: string,
  recipientId: string | null,
  payload: Record<string, unknown>
) {
  const { error } = await supabase.rpc('enqueue_support_notification', {
    p_event_type: eventType,
    p_ticket_id: ticketId,
    p_recipient_id: recipientId,
    p_recipient_email: null,
    p_payload: payload,
  })
  if (error) console.warn('Support notification enqueue failed:', error.message)
}

export async function fetchSupportKpis(): Promise<SupportKpis> {
  const [open, pending, resolved, highPriority] = await Promise.all([
    supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    supabase
      .from('support_tickets')
      .select('id', { count: 'exact', head: true })
      .in('status', ['pending_parent', 'in_progress']),
    supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'resolved'),
    supabase
      .from('support_tickets')
      .select('id', { count: 'exact', head: true })
      .eq('priority', 'high')
      .in('status', ['open', 'pending_parent', 'in_progress']),
  ])

  return {
    open: open.count ?? 0,
    pending: pending.count ?? 0,
    resolved: resolved.count ?? 0,
    highPriority: highPriority.count ?? 0,
  }
}

export async function fetchAdminSupportTickets(
  filters: SupportTicketFilters = {}
): Promise<PaginatedResult<AdminSupportTicket>> {
  const page = filters.page ?? 1
  const pageSize = filters.pageSize ?? 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('support_tickets')
    .select('*', { count: 'exact' })
    .order('updated_at', { ascending: false })
    .range(from, to)

  if (filters.status) query = query.eq('status', filters.status)
  if (filters.category) query = query.eq('category', filters.category)
  if (filters.priority) query = query.eq('priority', filters.priority)
  if (filters.search?.trim()) {
    const term = `%${filters.search.trim()}%`
    query = query.or(`subject.ilike.${term},ticket_number.ilike.${term},message.ilike.${term}`)
  }

  const { data, error, count } = await query
  if (error) throw error

  const tickets = data ?? []
  const userIds = [
    ...new Set([
      ...tickets.map((t) => t.parent_id),
      ...tickets.map((t) => t.assigned_to).filter(Boolean),
    ]),
  ] as string[]

  const profileMap: Record<string, { full_name: string; email: string | null }> = {}
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds)
    for (const p of profiles ?? []) {
      profileMap[p.id] = { full_name: p.full_name, email: p.email }
    }
  }

  const ticketIds = tickets.map((t) => t.id)
  const lastReplyMap: Record<string, string> = {}
  if (ticketIds.length > 0) {
    const { data: messages } = await supabase
      .from('support_messages')
      .select('ticket_id, created_at')
      .in('ticket_id', ticketIds)
      .order('created_at', { ascending: false })

    for (const msg of messages ?? []) {
      if (!lastReplyMap[msg.ticket_id]) lastReplyMap[msg.ticket_id] = msg.created_at
    }
  }

  return {
    data: tickets.map((t) => ({
      ...t,
      parent: profileMap[t.parent_id] ?? null,
      assignee: t.assigned_to ? profileMap[t.assigned_to] ?? null : null,
      last_reply_at: lastReplyMap[t.id] ?? t.created_at,
    })),
    total: count ?? 0,
    page,
    pageSize,
  }
}

export async function fetchAdminTicketDetail(ticketId: string): Promise<SupportTicketDetail> {
  const { data: ticket, error } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('id', ticketId)
    .maybeSingle()

  if (error) throw error
  if (!ticket) throw new Error('Ticket not found')

  const [{ data: messages, error: msgError }, { data: refunds, error: refundError }] =
    await Promise.all([
      supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true }),
      supabase
        .from('support_refund_requests')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: false }),
    ])

  if (msgError) throw msgError
  if (refundError) throw refundError

  const senderIds = [...new Set((messages ?? []).map((m) => m.sender_id).filter(Boolean))] as string[]
  const profileIds = [...new Set([ticket.parent_id, ticket.assigned_to, ...senderIds].filter(Boolean))] as string[]

  const profileMap: Record<string, { full_name: string; email: string | null }> = {}
  if (profileIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', profileIds)
    for (const p of profiles ?? []) {
      profileMap[p.id] = { full_name: p.full_name, email: p.email }
    }
  }

  return {
    ...ticket,
    parent: profileMap[ticket.parent_id] ?? null,
    assignee: ticket.assigned_to ? profileMap[ticket.assigned_to] ?? null : null,
    messages: (messages ?? []).map((m) => ({
      ...(m as SupportMessageRow),
      sender: m.sender_id ? profileMap[m.sender_id] ?? null : null,
    })),
    refund_requests: (refunds ?? []) as SupportRefundRequestRow[],
  }
}

export async function fetchSupportAgents(): Promise<
  { id: string; full_name: string; email: string | null; role: string }[]
> {
  const { data: roles, error } = await supabase
    .from('admin_roles')
    .select('user_id, role')
    .in('role', ['owner', 'support_agent', 'finance_admin'])

  if (error) throw error
  const ids = (roles ?? []).map((r) => r.user_id)
  if (ids.length === 0) return []

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', ids)

  const roleMap = Object.fromEntries((roles ?? []).map((r) => [r.user_id, r.role]))

  return (profiles ?? []).map((p) => ({
    id: p.id,
    full_name: p.full_name,
    email: p.email,
    role: roleMap[p.id] ?? 'support_agent',
  }))
}

export async function updateSupportTicketAdmin(
  ticketId: string,
  updates: Partial<
    Pick<SupportTicketRow, 'status' | 'assigned_to' | 'priority' | 'category' | 'admin_notes'>
  >
): Promise<void> {
  const payload = { ...updates, updated_at: new Date().toISOString() }
  const { error } = await supabase.from('support_tickets').update(payload).eq('id', ticketId)
  if (error) throw error
  await logAdminAction('support_ticket_updated', 'support_ticket', ticketId, updates as Record<string, unknown>)

  if (updates.status === 'resolved') {
    const { data: ticket } = await supabase
      .from('support_tickets')
      .select('parent_id, ticket_number')
      .eq('id', ticketId)
      .maybeSingle()
    if (ticket) {
      await enqueueNotification('ticket_resolved', ticketId, ticket.parent_id, {
        ticket_number: ticket.ticket_number,
      })
    }
  }
}

export async function sendAdminTicketReply(
  ticketId: string,
  adminId: string,
  message: string,
  options?: { setPendingParent?: boolean; attachmentUrl?: string | null }
): Promise<void> {
  const { error } = await supabase.from('support_messages').insert({
    ticket_id: ticketId,
    sender_id: adminId,
    sender_type: 'admin',
    message: message.trim(),
    is_internal: false,
    attachment_url: options?.attachmentUrl ?? null,
  })
  if (error) throw error

  const status = options?.setPendingParent === false ? 'in_progress' : 'pending_parent'
  await updateSupportTicketAdmin(ticketId, { status })

  const { data: ticket } = await supabase
    .from('support_tickets')
    .select('parent_id, ticket_number')
    .eq('id', ticketId)
    .maybeSingle()

  if (ticket) {
    await enqueueNotification('admin_replied', ticketId, ticket.parent_id, {
      ticket_number: ticket.ticket_number,
    })
  }

  await logAdminAction('support_ticket_replied', 'support_ticket', ticketId)
}

export async function addInternalSupportNote(
  ticketId: string,
  adminId: string,
  message: string
): Promise<void> {
  const { error } = await supabase.from('support_messages').insert({
    ticket_id: ticketId,
    sender_id: adminId,
    sender_type: 'admin',
    message: message.trim(),
    is_internal: true,
  })
  if (error) throw error
  await logAdminAction('support_internal_note', 'support_ticket', ticketId)
}

export async function createRefundRequest(
  ticketId: string,
  adminId: string,
  amount: number,
  reason: string
): Promise<SupportRefundRequestRow> {
  const { data, error } = await supabase
    .from('support_refund_requests')
    .insert({
      ticket_id: ticketId,
      amount,
      reason: reason.trim(),
      requested_by: adminId,
      status: 'pending',
    })
    .select('*')
    .single()

  if (error) throw error
  await logAdminAction('support_refund_requested', 'support_ticket', ticketId, { amount, reason })
  return data as SupportRefundRequestRow
}

export async function closeSupportTicket(ticketId: string): Promise<void> {
  await updateSupportTicketAdmin(ticketId, { status: 'closed' })
}

// Backward-compatible exports
export type SupportTicket = AdminSupportTicket
export const fetchSupportTickets = fetchAdminSupportTickets
export const updateSupportTicket = updateSupportTicketAdmin
