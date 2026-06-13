import { supabase } from '@/lib/supabase'

export interface AnalyticsData {
  dau: number
  wau: number
  mau: number
  freeUsers: number
  paidUsers: number
  topPaths: { name: string; count: number }[]
  topArticles: { name: string; count: number }[]
  quizPassRate: number
  starsThisWeek: number
}

function startOfDay(d = new Date()) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x.toISOString()
}

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

export async function fetchAnalytics(): Promise<AnalyticsData> {
  const today = startOfDay()
  const weekAgo = daysAgo(7)
  const monthAgo = daysAgo(30)

  const [dauRes, wauRes, mauRes, subsRes, pathProgRes, articleProgRes, quizRes, starsRes] =
    await Promise.all([
      supabase.from('article_progress').select('child_profile_id').gte('updated_at', today),
      supabase.from('article_progress').select('child_profile_id').gte('updated_at', weekAgo),
      supabase.from('article_progress').select('child_profile_id').gte('updated_at', monthAgo),
      supabase.from('subscriptions').select('plan, status, user_id'),
      supabase.from('path_progress').select('adventure_path_id, completed').eq('completed', true),
      supabase.from('article_progress').select('article_id').eq('read_completed', true),
      supabase.from('quiz_attempts').select('passed'),
      supabase.from('points_ledger').select('points').gte('created_at', weekAgo),
    ])

  const unique = (rows: { child_profile_id: string }[] | null) =>
    new Set((rows ?? []).map((r) => r.child_profile_id)).size

  const paidPlans = new Set(['family_monthly', 'family_yearly', 'homeschool', 'school'])
  const activeSubs = (subsRes.data ?? []).filter((s) => s.status === 'active')
  const paidUserIds = new Set(
    activeSubs.filter((s) => paidPlans.has(s.plan)).map((s) => s.user_id)
  )
  const freeUsers = activeSubs.filter((s) => s.plan === 'free').length
  const paidUsers = paidUserIds.size

  const pathCounts: Record<string, number> = {}
  ;(pathProgRes.data ?? []).forEach((r) => {
    pathCounts[r.adventure_path_id] = (pathCounts[r.adventure_path_id] ?? 0) + 1
  })
  const pathIds = Object.keys(pathCounts).sort((a, b) => pathCounts[b] - pathCounts[a]).slice(0, 5)
  const { data: paths } = pathIds.length
    ? await supabase.from('adventure_paths').select('id, title').in('id', pathIds)
    : { data: [] }
  const pathNameMap = Object.fromEntries((paths ?? []).map((p) => [p.id, p.title]))
  const topPaths = pathIds.map((id) => ({ name: pathNameMap[id] ?? id, count: pathCounts[id] }))

  const articleCounts: Record<string, number> = {}
  ;(articleProgRes.data ?? []).forEach((r) => {
    articleCounts[r.article_id] = (articleCounts[r.article_id] ?? 0) + 1
  })
  const articleIds = Object.keys(articleCounts).sort((a, b) => articleCounts[b] - articleCounts[a]).slice(0, 5)
  const { data: articles } = articleIds.length
    ? await supabase.from('articles').select('id, title').in('id', articleIds)
    : { data: [] }
  const articleNameMap = Object.fromEntries((articles ?? []).map((a) => [a.id, a.title]))
  const topArticles = articleIds.map((id) => ({ name: articleNameMap[id] ?? id, count: articleCounts[id] }))

  const attempts = quizRes.data ?? []
  const quizPassRate = attempts.length
    ? Math.round((attempts.filter((a) => a.passed).length / attempts.length) * 100)
    : 0

  const starsThisWeek = (starsRes.data ?? []).reduce((s, r) => s + (r.points ?? 0), 0)

  return {
    dau: unique(dauRes.data),
    wau: unique(wauRes.data),
    mau: unique(mauRes.data),
    freeUsers,
    paidUsers,
    topPaths,
    topArticles,
    quizPassRate,
    starsThisWeek,
  }
}
