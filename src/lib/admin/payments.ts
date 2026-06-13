import { supabase } from '@/lib/supabase'
import { logAdminAction } from '@/lib/admin/activity'
import { attachProfiles, fetchProfileMap } from '@/lib/admin/profileLookup'
import type {
  FailedPaymentRow,
  ManualAccessGrantRow,
  PaymentOverview,
  PaymentRecordRow,
} from '@/types/payments'
import type { SubscriptionPlan } from '@/lib/types'

export type {
  FailedPaymentRow,
  ManualAccessGrantRow,
  PaymentOverview,
  PaymentRecordRow,
} from '@/types/payments'

export async function fetchPaymentOverview(): Promise<PaymentOverview> {
  const [{ data: subs }, failedRes, refundRes] = await Promise.all([
    supabase.from('subscriptions').select('plan, status'),
    supabase
      .from('failed_payment_events')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'open'),
    supabase
      .from('support_refund_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
  ])

  const rows = subs ?? []
  const byPlan: Record<string, number> = {}
  let activeSubscriptions = 0
  let paidSubscriptions = 0
  let freeSubscriptions = 0
  let cancelledSubscriptions = 0

  for (const s of rows) {
    byPlan[s.plan] = (byPlan[s.plan] ?? 0) + 1
    if (s.status === 'active') activeSubscriptions++
    if (s.status === 'cancelled') cancelledSubscriptions++
    if (s.plan === 'free') freeSubscriptions++
    else if (s.status === 'active') paidSubscriptions++
  }

  return {
    activeSubscriptions,
    paidSubscriptions,
    freeSubscriptions,
    cancelledSubscriptions,
    openFailedPayments: failedRes.count ?? 0,
    pendingRefunds: refundRes.count ?? 0,
    byPlan,
  }
}

export async function fetchPaymentRecords(limit = 50): Promise<PaymentRecordRow[]> {
  const { data, error } = await supabase
    .from('payment_records')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  const rows = data ?? []
  const profileMap = await fetchProfileMap(rows.map((r) => r.user_id).filter(Boolean) as string[])
  return attachProfiles(rows, profileMap) as PaymentRecordRow[]
}

export async function createInternalPaymentNote(
  adminId: string,
  input: {
    userId?: string | null
    description: string
    amountCents?: number
    recordType?: PaymentRecordRow['record_type']
  }
): Promise<PaymentRecordRow> {
  const { data, error } = await supabase
    .from('payment_records')
    .insert({
      user_id: input.userId ?? null,
      amount_cents: input.amountCents ?? 0,
      currency: 'usd',
      status: 'pending',
      record_type: input.recordType ?? 'manual_note',
      description: input.description.trim(),
      source: 'internal',
      created_by: adminId,
    })
    .select('*')
    .single()

  if (error) throw error
  await logAdminAction('payment_record_created', 'payment_record', data.id, {
    internal_only: true,
  })
  return data as PaymentRecordRow
}

export async function fetchFailedPayments(): Promise<FailedPaymentRow[]> {
  const { data, error } = await supabase
    .from('failed_payment_events')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  const rows = data ?? []
  const profileMap = await fetchProfileMap(rows.map((r) => r.user_id).filter(Boolean) as string[])
  return attachProfiles(rows, profileMap) as FailedPaymentRow[]
}

export async function createFailedPaymentEvent(
  adminId: string,
  input: {
    userId?: string | null
    subscriptionId?: string | null
    amountCents: number
    failureReason: string
    adminNotes?: string
  }
): Promise<FailedPaymentRow> {
  const { data, error } = await supabase
    .from('failed_payment_events')
    .insert({
      user_id: input.userId ?? null,
      subscription_id: input.subscriptionId ?? null,
      amount_cents: input.amountCents,
      currency: 'usd',
      failure_reason: input.failureReason.trim(),
      admin_notes: input.adminNotes?.trim() ?? null,
      recorded_by: adminId,
      status: 'open',
    })
    .select('*')
    .single()

  if (error) throw error
  await logAdminAction('failed_payment_recorded', 'failed_payment', data.id)
  return data as FailedPaymentRow
}

export async function updateFailedPaymentStatus(
  id: string,
  status: FailedPaymentRow['status'],
  adminNotes?: string
): Promise<void> {
  const { error } = await supabase
    .from('failed_payment_events')
    .update({
      status,
      admin_notes: adminNotes ?? null,
      resolved_at: status !== 'open' ? new Date().toISOString() : null,
    })
    .eq('id', id)

  if (error) throw error
  await logAdminAction('failed_payment_updated', 'failed_payment', id, { status })
}

export async function fetchManualAccessGrants(limit = 30): Promise<ManualAccessGrantRow[]> {
  const { data, error } = await supabase
    .from('manual_access_grants')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  const rows = data ?? []
  const profileMap = await fetchProfileMap(rows.map((r) => r.user_id))
  return attachProfiles(rows, profileMap) as ManualAccessGrantRow[]
}

export async function grantManualFamilyAccess(
  adminId: string,
  input: {
    userId: string
    plan: SubscriptionPlan
    endDate?: string | null
    reason?: string
  }
): Promise<void> {
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', input.userId)
    .maybeSingle()

  let subscriptionId: string | null = existing?.id ?? null

  if (existing) {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        plan: input.plan,
        status: 'active',
        end_date: input.endDate ?? null,
      })
      .eq('id', existing.id)
    if (error) throw error
  } else {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: input.userId,
        plan: input.plan,
        status: 'active',
        start_date: new Date().toISOString().split('T')[0],
        end_date: input.endDate ?? null,
      })
      .select('id')
      .single()
    if (error) throw error
    subscriptionId = data.id
  }

  const { error: grantError } = await supabase.from('manual_access_grants').insert({
    user_id: input.userId,
    subscription_id: subscriptionId,
    plan: input.plan,
    end_date: input.endDate ?? null,
    reason: input.reason?.trim() ?? null,
    granted_by: adminId,
  })

  if (grantError) throw grantError
  await logAdminAction('manual_access_granted', 'subscription', subscriptionId ?? undefined, {
    user_id: input.userId,
    plan: input.plan,
  })
}

export function formatCents(cents: number, currency = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100)
}
