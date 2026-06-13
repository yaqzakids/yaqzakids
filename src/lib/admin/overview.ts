import { supabase } from '@/lib/supabase'
import { fetchRecentActivity, type AdminActivityEntry } from './activity'
import { fetchSupportTickets, type AdminSupportTicket } from './support'

export interface OverviewStats {
  totalParentAccounts: number
  totalChildProfiles: number
  activeSubscribers: number
  freeUsers: number
  totalArticles: number
  publishedArticles: number
  totalQuizzes: number
  openSupportTickets: number
}

export interface UserGrowthPoint {
  label: string
  parents: number
  children: number
}

export interface PillarActivity {
  name: string
  count: number
  color: string
}

export interface LatestFamilyRow {
  id: string
  name: string
  email: string | null
  childrenCount: number
  joined: string
  status: string
}

export interface DashboardOverviewData {
  stats: OverviewStats
  userGrowth: UserGrowthPoint[]
  usersByType: { name: string; value: number; color: string }[]
  activePillars: PillarActivity[]
  recentTickets: AdminSupportTicket[]
  recentActivity: AdminActivityEntry[]
  latestFamilies: LatestFamilyRow[]
}

export async function fetchOverviewStats(): Promise<OverviewStats> {
  const [
    usersRes,
    childrenRes,
    activeSubsRes,
    freeSubsRes,
    allArticlesRes,
    publishedArticlesRes,
    quizzesRes,
    openTicketsRes,
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('child_profiles').select('id', { count: 'exact', head: true }),
    supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active').neq('plan', 'free'),
    supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('plan', 'free'),
    supabase.from('articles').select('id', { count: 'exact', head: true }),
    supabase.from('articles').select('id', { count: 'exact', head: true }).eq('published', true),
    supabase.from('quizzes').select('id', { count: 'exact', head: true }),
    supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'open').then(async (r) => {
      if (r.error) {
        const legacy = await supabase.from('support_messages').select('id', { count: 'exact', head: true }).eq('status', 'open')
        return legacy
      }
      return r
    }),
  ])

  return {
    totalParentAccounts: usersRes.count ?? 0,
    totalChildProfiles: childrenRes.count ?? 0,
    activeSubscribers: activeSubsRes.count ?? 0,
    freeUsers: freeSubsRes.count ?? 0,
    totalArticles: allArticlesRes.count ?? 0,
    publishedArticles: publishedArticlesRes.count ?? 0,
    totalQuizzes: quizzesRes.count ?? 0,
    openSupportTickets: openTicketsRes.count ?? 0,
  }
}

function last7DayLabels(): string[] {
  const labels: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }))
  }
  return labels
}

function bucketByDay(dates: string[], labels: string[]): number[] {
  const counts = new Array(labels.length).fill(0)
  const dayKeys = labels.map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toDateString()
  })
  dates.forEach((iso) => {
    const key = new Date(iso).toDateString()
    const idx = dayKeys.indexOf(key)
    if (idx >= 0) counts[idx]++
  })
  return counts
}

async function fetchUserGrowth(): Promise<UserGrowthPoint[]> {
  const since = new Date()
  since.setDate(since.getDate() - 6)
  since.setHours(0, 0, 0, 0)

  const [profilesRes, childrenRes] = await Promise.all([
    supabase.from('profiles').select('created_at').gte('created_at', since.toISOString()),
    supabase.from('child_profiles').select('created_at').gte('created_at', since.toISOString()),
  ])

  const labels = last7DayLabels()
  const parentCounts = bucketByDay((profilesRes.data ?? []).map((p) => p.created_at), labels)
  const childCounts = bucketByDay((childrenRes.data ?? []).map((c) => c.created_at), labels)

  return labels.map((label, i) => ({
    label,
    parents: parentCounts[i],
    children: childCounts[i],
  }))
}

async function fetchActivePillars(): Promise<PillarActivity[]> {
  const { data: pillars } = await supabase.from('pillars').select('id, name, color').order('sort_order')
  if (!pillars?.length) return []

  const { data: progress } = await supabase
    .from('article_progress')
    .select('article_id')
    .eq('read_completed', true)

  if (!progress?.length) {
    return pillars.map((p) => ({ name: p.name, count: 0, color: p.color ?? '#2AAFA0' }))
  }

  const articleIds = [...new Set(progress.map((p) => p.article_id))]
  const { data: articles } = await supabase.from('articles').select('id, pillar_id').in('id', articleIds)

  const counts: Record<string, number> = {}
  const progressByArticle: Record<string, number> = {}
  progress.forEach((p) => {
    progressByArticle[p.article_id] = (progressByArticle[p.article_id] ?? 0) + 1
  })
  ;(articles ?? []).forEach((a) => {
    const n = progressByArticle[a.id] ?? 0
    if (n > 0) counts[a.pillar_id] = (counts[a.pillar_id] ?? 0) + n
  })

  return pillars
    .map((p) => ({ name: p.name, count: counts[p.id] ?? 0, color: p.color ?? '#2AAFA0' }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
}

async function fetchLatestFamilies(limit = 8): Promise<LatestFamilyRow[]> {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, created_at, suspended')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !profiles?.length) return []

  const ids = profiles.map((p) => p.id)
  const [{ data: children }, { data: subs }] = await Promise.all([
    supabase.from('child_profiles').select('parent_id'),
    supabase.from('subscriptions').select('user_id, plan, status').in('user_id', ids),
  ])

  const childCounts: Record<string, number> = {}
  ;(children ?? []).forEach((c) => {
    childCounts[c.parent_id] = (childCounts[c.parent_id] ?? 0) + 1
  })

  const subMap: Record<string, { plan: string; status: string }> = {}
  ;(subs ?? []).forEach((s) => { subMap[s.user_id] = { plan: s.plan, status: s.status } })

  return profiles.map((p) => {
    const sub = subMap[p.id]
    let status = 'Free'
    if (p.suspended) status = 'Suspended'
    else if (sub?.status === 'active' && sub.plan !== 'free') status = 'Subscribed'
    else if (sub?.status === 'active') status = 'Active'

    return {
      id: p.id,
      name: p.full_name,
      email: p.email,
      childrenCount: childCounts[p.id] ?? 0,
      joined: p.created_at,
      status,
    }
  })
}

export async function fetchDashboardOverview(): Promise<DashboardOverviewData> {
  const stats = await fetchOverviewStats()
  const [userGrowth, activePillars, recentTickets, recentActivity, latestFamilies] = await Promise.all([
    fetchUserGrowth(),
    fetchActivePillars(),
    fetchSupportTickets({ pageSize: 5 }).then((t) => t.data).catch(() => []),
    fetchRecentActivity(8).catch(() => []),
    fetchLatestFamilies(),
  ])

  const trialCount = 0 // placeholder until trial tracking exists

  return {
    stats,
    userGrowth,
    usersByType: [
      { name: 'Free', value: stats.freeUsers, color: '#7C5CFC' },
      { name: 'Subscribers', value: stats.activeSubscribers, color: '#2AAFA0' },
      { name: 'Trial', value: trialCount, color: '#F5A623' },
    ],
    activePillars,
    recentTickets,
    recentActivity,
    latestFamilies,
  }
}
