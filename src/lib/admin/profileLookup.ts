import { supabase } from '@/lib/supabase'

export type ProfileSnippet = { full_name: string; email: string | null }

export async function fetchProfileMap(userIds: string[]): Promise<Record<string, ProfileSnippet>> {
  const ids = [...new Set(userIds.filter(Boolean))]
  if (ids.length === 0) return {}

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', ids)

  if (error) throw error

  return Object.fromEntries(
    (data ?? []).map((p) => [p.id, { full_name: p.full_name, email: p.email }])
  )
}

export function attachProfiles<T extends { user_id: string | null }>(
  rows: T[],
  profileMap: Record<string, ProfileSnippet>
): (T & { user: ProfileSnippet | null })[] {
  return rows.map((row) => ({
    ...row,
    user: row.user_id ? profileMap[row.user_id] ?? null : null,
  }))
}
