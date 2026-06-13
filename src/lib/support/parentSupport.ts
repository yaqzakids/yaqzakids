import { supabase } from '@/lib/supabase'
import { SUPPORT_ATTACHMENT_BUCKET } from '@/lib/support/constants'
import type {
  CreateSupportTicketInput,
  PaginatedResult,
  SupportMessageRow,
  SupportTicketDetail,
  SupportTicketSummary,
} from '@/lib/support/types'

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

export async function uploadSupportAttachment(
  parentId: string,
  file: File
): Promise<string> {
  const ext = file.name.split('.').pop()?.replace(/[^a-z0-9]/gi, '') || 'bin'
  const path = `${parentId}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage.from(SUPPORT_ATTACHMENT_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  })

  if (error) throw error
  return path
}

export async function createSupportTicket(
  parentId: string,
  input: CreateSupportTicketInput
): Promise<{ ticket_number: string; id: string }> {
  const { data, error } = await supabase
    .from('support_tickets')
    .insert({
      parent_id: parentId,
      subject: input.subject.trim(),
      category: input.category,
      priority: input.priority,
      message: input.message.trim(),
      attachment_url: input.attachmentUrl ?? null,
      status: 'open',
    })
    .select('id, ticket_number')
    .single()

  if (error) throw error

  await enqueueNotification('ticket_created', data.id, parentId, {
    ticket_number: data.ticket_number,
    subject: input.subject,
  })

  return { id: data.id, ticket_number: data.ticket_number }
}

export async function fetchParentTickets(
  parentId: string,
  statusFilter: string[] | null,
  page = 1,
  pageSize = 10
): Promise<PaginatedResult<SupportTicketSummary>> {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('support_tickets')
    .select('*', { count: 'exact' })
    .eq('parent_id', parentId)
    .order('updated_at', { ascending: false })
    .range(from, to)

  if (statusFilter && statusFilter.length > 0) {
    query = query.in('status', statusFilter)
  }

  const { data, error, count } = await query
  if (error) throw error

  const tickets = data ?? []
  const ticketIds = tickets.map((t) => t.id)

  let lastReplyMap: Record<string, string> = {}
  if (ticketIds.length > 0) {
    const { data: messages } = await supabase
      .from('support_messages')
      .select('ticket_id, created_at')
      .in('ticket_id', ticketIds)
      .eq('is_internal', false)
      .order('created_at', { ascending: false })

    for (const msg of messages ?? []) {
      if (!lastReplyMap[msg.ticket_id]) {
        lastReplyMap[msg.ticket_id] = msg.created_at
      }
    }
  }

  return {
    data: tickets.map((t) => ({
      ...t,
      last_reply_at: lastReplyMap[t.id] ?? t.created_at,
    })),
    total: count ?? 0,
    page,
    pageSize,
  }
}

export async function fetchParentTicketDetail(
  parentId: string,
  ticketId: string
): Promise<SupportTicketDetail> {
  const { data: ticket, error } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('id', ticketId)
    .eq('parent_id', parentId)
    .maybeSingle()

  if (error) throw error
  if (!ticket) throw new Error('Ticket not found')

  const { data: messages, error: msgError } = await supabase
    .from('support_messages')
    .select('*')
    .eq('ticket_id', ticketId)
    .eq('is_internal', false)
    .order('created_at', { ascending: true })

  if (msgError) throw msgError

  return {
    ...ticket,
    messages: (messages ?? []) as SupportMessageRow[],
  }
}

export async function replyToTicketAsParent(
  parentId: string,
  ticketId: string,
  message: string,
  attachmentUrl?: string | null
): Promise<void> {
  const { data: ticket, error: ticketError } = await supabase
    .from('support_tickets')
    .select('id, status')
    .eq('id', ticketId)
    .eq('parent_id', parentId)
    .maybeSingle()

  if (ticketError) throw ticketError
  if (!ticket) throw new Error('Ticket not found')
  if (ticket.status === 'closed') throw new Error('This ticket is closed')

  const { error } = await supabase.from('support_messages').insert({
    ticket_id: ticketId,
    sender_id: parentId,
    sender_type: 'parent',
    message: message.trim(),
    attachment_url: attachmentUrl ?? null,
    is_internal: false,
  })

  if (error) throw error

  if (ticket.status === 'pending_parent' || ticket.status === 'resolved') {
    await supabase
      .from('support_tickets')
      .update({ status: 'open', updated_at: new Date().toISOString() })
      .eq('id', ticketId)
  } else {
    await supabase
      .from('support_tickets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', ticketId)
  }
}

export async function getSignedAttachmentUrl(storagePath: string): Promise<string | null> {
  const marker = `${SUPPORT_ATTACHMENT_BUCKET}/`
  const idx = storagePath.indexOf(marker)
  const path = idx >= 0 ? storagePath.slice(idx + marker.length) : storagePath

  const { data, error } = await supabase.storage
    .from(SUPPORT_ATTACHMENT_BUCKET)
    .createSignedUrl(path, 3600)

  if (error) return null
  return data.signedUrl
}
