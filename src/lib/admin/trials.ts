import { supabase } from '@/lib/supabase'
import { logAdminAction } from '@/lib/admin/activity'
import { attachProfiles, fetchProfileMap } from '@/lib/admin/profileLookup'
import type { TrialExtensionRow } from '@/types/payments'

export type { TrialExtensionRow } from '@/types/payments'

async function getDefaultTrialDays(): Promise<number> {
  const { data } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'free_trial_days')
    .maybeSingle()

  return Number(data?.value ?? 14)
}

export async function fetchTrialExtensions(limit = 50): Promise<TrialExtensionRow[]> {
  const { data, error } = await supabase
    .from('trial_extensions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  const rows = data ?? []
  const profileMap = await fetchProfileMap(rows.map((r) => r.user_id))
  return attachProfiles(rows, profileMap) as TrialExtensionRow[]
}

export async function extendFreeTrial(
  adminId: string,
  userId: string,
  extraDays: number,
  reason?: string
): Promise<TrialExtensionRow> {
  const trialDays = await getDefaultTrialDays()

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('created_at, trial_ends_at')
    .eq('id', userId)
    .single()

  if (profileError) throw profileError

  const baseEnd = profile.trial_ends_at
    ? new Date(profile.trial_ends_at)
    : new Date(new Date(profile.created_at).getTime() + trialDays * 86400000)

  const now = new Date()
  const startFrom = baseEnd > now ? baseEnd : now
  const newTrialEndsAt = new Date(startFrom.getTime() + extraDays * 86400000)

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ trial_ends_at: newTrialEndsAt.toISOString() })
    .eq('id', userId)

  if (updateError) throw updateError

  const { data, error } = await supabase
    .from('trial_extensions')
    .insert({
      user_id: userId,
      extra_days: extraDays,
      trial_ends_at: newTrialEndsAt.toISOString(),
      reason: reason?.trim() ?? null,
      granted_by: adminId,
    })
    .select('*')
    .single()

  if (error) throw error
  await logAdminAction('trial_extended', 'profile', userId, { extra_days: extraDays })
  return data as TrialExtensionRow
}
