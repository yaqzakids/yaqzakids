import { supabase } from '@/lib/supabase'
import { logAdminAction } from '@/lib/admin/activity'
import type { AdminRefundRow, RefundStats, RefundStatus } from '@/types/payments'

export type { AdminRefundRow, RefundStatus } from '@/types/payments'

export async function fetchAdminRefunds(): Promise<AdminRefundRow[]> {
  const { data, error } = await supabase
    .from('support_refund_requests')
    .select(
      `
      *,
      ticket:support_tickets(
        ticket_number,
        subject,
        parent_id,
        parent:profiles!support_tickets_parent_id_fkey(full_name, email)
      ),
      requester:profiles!support_refund_requests_requested_by_fkey(full_name, email)
    `
    )
    .order('created_at', { ascending: false })

  if (error) {
    const fallback = await supabase
      .from('support_refund_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (fallback.error) throw fallback.error

    const ticketIds = [...new Set((fallback.data ?? []).map((r) => r.ticket_id))]
    const { data: tickets } = await supabase
      .from('support_tickets')
      .select('id, ticket_number, subject, parent_id')
      .in('id', ticketIds.length ? ticketIds : ['00000000-0000-0000-0000-000000000000'])

    const parentIds = [...new Set((tickets ?? []).map((t) => t.parent_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', parentIds.length ? parentIds : ['00000000-0000-0000-0000-000000000000'])

    const ticketMap = Object.fromEntries((tickets ?? []).map((t) => [t.id, t]))
    const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]))

    return (fallback.data ?? []).map((r) => {
      const ticket = ticketMap[r.ticket_id]
      const parent = ticket ? profileMap[ticket.parent_id] : null
      return {
        ...r,
        ticket: ticket
          ? { ...ticket, parent: parent ?? null }
          : null,
      }
    }) as AdminRefundRow[]
  }

  return (data ?? []) as AdminRefundRow[]
}

export async function updateRefundStatus(
  id: string,
  status: RefundStatus,
  adminNotes?: string,
  stripeRefundId?: string
): Promise<void> {
  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
    admin_notes: adminNotes ?? null,
  }

  if (status === 'processed' || status === 'approved') {
    updates.processed_at = new Date().toISOString()
  }
  if (stripeRefundId) {
    updates.stripe_refund_id = stripeRefundId
  }

  const { error } = await supabase.from('support_refund_requests').update(updates).eq('id', id)
  if (error) throw error
  await logAdminAction('refund_status_updated', 'refund_request', id, {
    status,
    internal_only: !stripeRefundId,
  })
}

export async function fetchRefundStats(): Promise<RefundStats> {
  const { data, error } = await supabase.from('support_refund_requests').select('status, amount')
  if (error) throw error

  const rows = data ?? []
  return {
    pending: rows.filter((r) => r.status === 'pending').length,
    approved: rows.filter((r) => r.status === 'approved').length,
    processed: rows.filter((r) => r.status === 'processed').length,
    rejected: rows.filter((r) => r.status === 'rejected').length,
    totalAmountPending: rows
      .filter((r) => r.status === 'pending')
      .reduce((sum, r) => sum + Number(r.amount), 0),
  }
}
