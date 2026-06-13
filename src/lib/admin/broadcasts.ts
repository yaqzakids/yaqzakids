import { supabase } from '@/lib/supabase'
import { logAdminAction } from '@/lib/admin/activity'
import type { BroadcastAudience, BroadcastType } from '@/lib/messaging/constants'
import type { BroadcastRow } from '@/lib/messaging/types'
import type { SubscriptionPlan } from '@/lib/types'

const PAID_PLANS: SubscriptionPlan[] = ['family_monthly', 'family_yearly', 'homeschool', 'school']

export interface BroadcastInput {
  broadcastType: BroadcastType
  title: string
  message: string
  audience: BroadcastAudience
  draftId?: string | null
}

export async function fetchBroadcastDrafts(): Promise<BroadcastRow[]> {
  const { data, error } = await supabase
    .from('broadcasts')
    .select('*')
    .eq('status', 'draft')
    .order('updated_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as BroadcastRow[]
}

export async function fetchRecentBroadcasts(limit = 5): Promise<BroadcastRow[]> {
  const { data, error } = await supabase
    .from('broadcasts')
    .select('*')
    .eq('status', 'sent')
    .order('sent_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as BroadcastRow[]
}

export async function resolveBroadcastRecipientIds(audience: BroadcastAudience): Promise<string[]> {
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, created_at, suspended')
    .eq('role', 'parent')

  if (profileError) throw profileError

  const { data: subs, error: subError } = await supabase
    .from('subscriptions')
    .select('user_id, plan, status')

  if (subError) throw subError

  const subMap = Object.fromEntries((subs ?? []).map((s) => [s.user_id, s]))

  const { data: trialSetting } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'free_trial_days')
    .maybeSingle()

  const trialDays = Number(trialSetting?.value ?? 14)
  const now = Date.now()

  return (profiles ?? [])
    .filter((p) => {
      if (p.suspended) return false
      const sub = subMap[p.id]
      const isPremium =
        sub?.status === 'active' && sub.plan && PAID_PLANS.includes(sub.plan as SubscriptionPlan)
      const isFree = !isPremium
      const inTrial =
        isFree &&
        p.created_at &&
        now - new Date(p.created_at).getTime() < trialDays * 86400000
      const isInactive =
        !sub ||
        sub.status === 'cancelled' ||
        sub.status === 'expired' ||
        (isFree && !inTrial)

      if (audience === 'all') return true
      if (audience === 'premium') return isPremium
      if (audience === 'trial') return inTrial
      if (audience === 'inactive') return isInactive
      if (audience === 'free') return isFree
      return false
    })
    .map((p) => p.id)
}

export async function saveBroadcastDraft(
  adminId: string,
  input: BroadcastInput
): Promise<BroadcastRow> {
  const payload = {
    broadcast_type: input.broadcastType,
    title: input.title.trim(),
    message: input.message.trim(),
    audience: input.audience,
    status: 'draft' as const,
    updated_at: new Date().toISOString(),
  }

  if (input.draftId) {
    const { data, error } = await supabase
      .from('broadcasts')
      .update(payload)
      .eq('id', input.draftId)
      .eq('status', 'draft')
      .select('*')
      .single()

    if (error) throw error
    await logAdminAction('broadcast_draft_saved', 'broadcast', data.id)
    return data as BroadcastRow
  }

  const { data, error } = await supabase
    .from('broadcasts')
    .insert({ ...payload, created_by: adminId })
    .select('*')
    .single()

  if (error) throw error
  await logAdminAction('broadcast_draft_created', 'broadcast', data.id)
  return data as BroadcastRow
}

export async function sendBroadcast(adminId: string, input: BroadcastInput): Promise<string> {
  const recipientIds = await resolveBroadcastRecipientIds(input.audience)
  if (recipientIds.length === 0) {
    throw new Error('No families match the selected audience')
  }

  const { data, error } = await supabase.rpc('admin_send_broadcast', {
    p_broadcast_type: input.broadcastType,
    p_title: input.title.trim(),
    p_message: input.message.trim(),
    p_audience: input.audience,
    p_recipient_ids: recipientIds,
    p_sender_id: adminId,
    p_draft_id: input.draftId ?? null,
  })

  if (error) throw error

  const broadcastId = data as string
  await logAdminAction('broadcast_sent', 'broadcast', broadcastId, {
    audience: input.audience,
    recipient_count: recipientIds.length,
  })
  return broadcastId
}

export async function deleteBroadcastDraft(id: string): Promise<void> {
  const { error } = await supabase.from('broadcasts').delete().eq('id', id).eq('status', 'draft')
  if (error) throw error
  await logAdminAction('broadcast_draft_deleted', 'broadcast', id)
}
