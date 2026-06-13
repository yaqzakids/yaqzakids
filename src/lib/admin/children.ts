import { supabase } from '@/lib/supabase'
import { logAdminAction } from './activity'
import type { AgeGroup } from '@/lib/types'

export interface AdminChildRow {
  id: string
  name: string
  age_group: AgeGroup
  points: number
  streak_days: number
  last_active_date: string | null
  parent: { email: string | null; full_name: string } | null
  badges_count: number
  articles_completed: number
}

export interface AdminChildDetail {
  pathsStarted: number
  pathsCompleted: number
  articlesCompleted: number
  badges: { name: string; awarded_at: string }[]
}

export async function fetchAdminChildren(): Promise<AdminChildRow[]> {
  const { data: children, error } = await supabase
    .from('child_profiles')
    .select('id, name, age_group, points, streak_days, last_active_date, parent:profiles(email, full_name)')
    .order('name')
  if (error) throw error

  const { data: badges } = await supabase.from('child_badges').select('child_profile_id')
  const { data: progress } = await supabase
    .from('article_progress')
    .select('child_profile_id')
    .eq('read_completed', true)
    .eq('quiz_passed', true)

  const badgeCounts: Record<string, number> = {}
  ;(badges ?? []).forEach((b) => { badgeCounts[b.child_profile_id] = (badgeCounts[b.child_profile_id] ?? 0) + 1 })

  const articleCounts: Record<string, number> = {}
  ;(progress ?? []).forEach((p) => { articleCounts[p.child_profile_id] = (articleCounts[p.child_profile_id] ?? 0) + 1 })

  return (children ?? []).map((c) => {
    const parent = (Array.isArray(c.parent) ? c.parent[0] : c.parent) as AdminChildRow['parent']
    return {
      ...c,
      parent,
      badges_count: badgeCounts[c.id] ?? 0,
      articles_completed: articleCounts[c.id] ?? 0,
    }
  })
}

export async function fetchChildDetail(childId: string): Promise<AdminChildDetail> {
  const [pathsRes, articlesRes, badgesRes] = await Promise.all([
    supabase.from('path_progress').select('completed').eq('child_profile_id', childId),
    supabase.from('article_progress').select('id', { count: 'exact', head: true })
      .eq('child_profile_id', childId).eq('read_completed', true).eq('quiz_passed', true),
    supabase.from('child_badges').select('awarded_at, badge:badges(name)').eq('child_profile_id', childId),
  ])

  const paths = pathsRes.data ?? []
  return {
    pathsStarted: paths.length,
    pathsCompleted: paths.filter((p) => p.completed).length,
    articlesCompleted: articlesRes.count ?? 0,
    badges: (badgesRes.data ?? []).map((b) => {
      const badge = (Array.isArray(b.badge) ? b.badge[0] : b.badge) as { name: string } | null
      return {
        name: badge?.name ?? 'Badge',
        awarded_at: b.awarded_at,
      }
    }),
  }
}

export async function updateChildAgeGroup(childId: string, age_group: AgeGroup): Promise<void> {
  const { error } = await supabase.from('child_profiles').update({ age_group }).eq('id', childId)
  if (error) throw error
  await logAdminAction('child_age_group_changed', 'child', childId, { age_group })
}

export async function resetChildProgress(childId: string): Promise<void> {
  const { error } = await supabase.rpc('admin_reset_child_progress', { p_child_id: childId })
  if (error) throw error
  await logAdminAction('child_progress_reset', 'child', childId)
}

export async function deleteChildProfile(childId: string): Promise<void> {
  const { error } = await supabase.from('child_profiles').delete().eq('id', childId)
  if (error) throw error
  await logAdminAction('child_deleted', 'child', childId)
}
