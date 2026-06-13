import { supabase } from '@/lib/supabase'
import { logAdminAction } from './activity'
import type { SubscriptionPlan, SubscriptionStatus } from '@/lib/types'

export interface AdminSubscriptionRow {
  id: string
  user_id: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  start_date: string
  end_date: string | null
  stripe_subscription_id: string | null
  user?: { email: string | null; full_name: string } | null
}

export async function fetchAdminSubscriptions(): Promise<AdminSubscriptionRow[]> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*, user:profiles(email, full_name)')
    .order('start_date', { ascending: false })
  if (error) throw error
  return (data ?? []) as AdminSubscriptionRow[]
}

export async function updateSubscription(
  id: string,
  updates: Partial<{ plan: SubscriptionPlan; status: SubscriptionStatus; end_date: string | null }>
): Promise<void> {
  const { error } = await supabase.from('subscriptions').update(updates).eq('id', id)
  if (error) throw error
  await logAdminAction('subscription_updated', 'subscription', id, updates as Record<string, unknown>)
}

export async function createManualSubscription(
  userId: string,
  plan: SubscriptionPlan,
  endDate?: string
): Promise<void> {
  const { data, error } = await supabase.from('subscriptions').insert({
    user_id: userId,
    plan,
    status: 'active',
    start_date: new Date().toISOString().split('T')[0],
    end_date: endDate ?? null,
  }).select('id').single()
  if (error) throw error
  await logAdminAction('manual_subscription_created', 'subscription', data.id, { user_id: userId, plan })
}

export async function fetchUsersForSelect() {
  const { data, error } = await supabase.from('profiles').select('id, full_name, email').order('full_name')
  if (error) throw error
  return data ?? []
}
