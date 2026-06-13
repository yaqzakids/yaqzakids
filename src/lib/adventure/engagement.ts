import { supabase } from '../supabase'
import type { ChildStreak, ChildDashboardAnalytics } from './types'

/** Sum all points from points_ledger (Stars in UI) */
export async function fetchChildStarsTotal(childId: string): Promise<number> {
  const { data, error } = await supabase
    .from('points_ledger')
    .select('points')
    .eq('child_profile_id', childId)

  if (error) throw error
  return (data ?? []).reduce((sum, row) => sum + row.points, 0)
}

export async function fetchChildStreak(childId: string): Promise<ChildStreak | null> {
  const { data, error } = await supabase
    .from('child_streaks')
    .select('*')
    .eq('child_profile_id', childId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function fetchChildDashboardAnalytics(childId: string): Promise<ChildDashboardAnalytics> {
  const [
    starsRes,
    streakRes,
    articlesRes,
    quizzesRes,
    badgesRes,
    pillarRes,
  ] = await Promise.all([
    supabase.from('points_ledger').select('points').eq('child_profile_id', childId),
    supabase.from('child_streaks').select('*').eq('child_profile_id', childId).maybeSingle(),
    supabase
      .from('article_progress')
      .select('id', { count: 'exact', head: true })
      .eq('child_profile_id', childId)
      .eq('read_completed', true)
      .eq('quiz_passed', true),
    supabase
      .from('quiz_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('child_profile_id', childId)
      .eq('passed', true),
    supabase
      .from('child_badges')
      .select('id', { count: 'exact', head: true })
      .eq('child_profile_id', childId),
    supabase
      .from('article_progress')
      .select('article:articles(pillar:pillars(name))')
      .eq('child_profile_id', childId)
      .eq('read_completed', true)
      .eq('quiz_passed', true),
  ])

  const totalStars = (starsRes.data ?? []).reduce((sum, row) => sum + row.points, 0)
  const streak = streakRes.data

  // Count articles by pillar for "Most Active Pillar"
  const pillarCounts: Record<string, number> = {}
  for (const row of pillarRes.data ?? []) {
    const article = row.article as { pillar?: { name?: string } } | null
    const name = article?.pillar?.name
    if (name) pillarCounts[name] = (pillarCounts[name] ?? 0) + 1
  }
  const mostActivePillar =
    Object.entries(pillarCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  const hasActivity =
    totalStars > 0 ||
    (articlesRes.count ?? 0) > 0 ||
    (quizzesRes.count ?? 0) > 0 ||
    (badgesRes.count ?? 0) > 0 ||
    streak?.last_activity_date != null

  return {
    childId,
    totalStars,
    currentStreak: streak?.current_streak ?? 0,
    longestStreak: streak?.longest_streak ?? 0,
    articlesCompleted: articlesRes.count ?? 0,
    quizzesPassed: quizzesRes.count ?? 0,
    badgesEarned: badgesRes.count ?? 0,
    lastActive: streak?.last_activity_date ?? null,
    mostActivePillar,
    hasActivity,
  }
}
