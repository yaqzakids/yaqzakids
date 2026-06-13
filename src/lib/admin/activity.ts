import { supabase } from '@/lib/supabase'

export interface AdminActivityEntry {
  id: string
  admin_id: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  details: Record<string, unknown> | null
  created_at: string
  admin?: { full_name: string } | null
}

export async function logAdminAction(
  action: string,
  entityType?: string,
  entityId?: string,
  details?: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase.rpc('log_admin_action', {
    p_action: action,
    p_entity_type: entityType ?? null,
    p_entity_id: entityId ?? null,
    p_details: details ?? null,
  })
  if (error) console.error('Failed to log admin action:', error.message)
}

export async function fetchRecentActivity(limit = 20): Promise<AdminActivityEntry[]> {
  const { data, error } = await supabase
    .from('admin_activity_log')
    .select('*, admin:profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as AdminActivityEntry[]
}

export async function fetchAdminActivityLog(limit = 100): Promise<AdminActivityEntry[]> {
  return fetchRecentActivity(limit)
}
