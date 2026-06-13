import { supabase } from '@/lib/supabase'
import { logAdminAction } from './activity'
import type { AgeGroup, UserRole } from '@/lib/types'

export interface AdminUserRow {
  id: string
  full_name: string
  email: string | null
  role: UserRole
  language: string
  suspended: boolean
  admin_notes: string | null
  created_at: string
  subscription?: { plan: string; status: string } | null
  children_count: number
}

export interface AdminUserChild {
  id: string
  name: string
  age_group: AgeGroup
  points: number
  total_articles_read: number
  total_quizzes_completed: number
  streak_days: number
}

export async function fetchAdminUsers(): Promise<AdminUserRow[]> {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, language, suspended, admin_notes, created_at')
    .order('created_at', { ascending: false })
  if (error) throw error

  const { data: subs } = await supabase.from('subscriptions').select('user_id, plan, status')
  const { data: children } = await supabase.from('child_profiles').select('parent_id')

  const subMap: Record<string, { plan: string; status: string }> = {}
  ;(subs ?? []).forEach((s) => { subMap[s.user_id] = { plan: s.plan, status: s.status } })

  const childCounts: Record<string, number> = {}
  ;(children ?? []).forEach((c) => { childCounts[c.parent_id] = (childCounts[c.parent_id] ?? 0) + 1 })

  return (profiles ?? []).map((p) => ({
    ...p,
    subscription: subMap[p.id] ?? null,
    children_count: childCounts[p.id] ?? 0,
  }))
}

export async function fetchUserChildren(parentId: string): Promise<AdminUserChild[]> {
  const { data, error } = await supabase
    .from('child_profiles')
    .select('id, name, age_group, points, total_articles_read, total_quizzes_completed, streak_days')
    .eq('parent_id', parentId)
  if (error) throw error
  return (data ?? []) as AdminUserChild[]
}

export async function updateUserRole(userId: string, role: UserRole): Promise<void> {
  if (role === 'admin') {
    throw new Error('Admin access is managed from Admin Users by the owner only.')
  }
  const { error } = await supabase.from('profiles').update({ role }).eq('id', userId)
  if (error) throw error
  await logAdminAction('user_role_changed', 'profile', userId, { role })
}

export async function setUserSuspended(userId: string, suspended: boolean): Promise<void> {
  const { error } = await supabase.from('profiles').update({ suspended }).eq('id', userId)
  if (error) throw error
  await logAdminAction(suspended ? 'user_suspended' : 'user_unsuspended', 'profile', userId)
}

export async function updateUserNotes(userId: string, admin_notes: string): Promise<void> {
  const { error } = await supabase.from('profiles').update({ admin_notes }).eq('id', userId)
  if (error) throw error
  await logAdminAction('user_notes_updated', 'profile', userId)
}

export async function deleteUser(userId: string): Promise<void> {
  const { error } = await supabase.from('profiles').delete().eq('id', userId)
  if (error) throw error
  await logAdminAction('user_deleted', 'profile', userId)
}
