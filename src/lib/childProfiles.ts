import { fetchChildDashboardAnalytics, fetchChildStarsTotal } from '@/lib/adventure/engagement'
import { getLevelProgress, STAR_LEVELS } from '@/lib/adventure/levels'
import { fetchLastUnfinishedArticle, resolveArticleUrl } from '@/lib/discoverer'
import { supabase } from '@/lib/supabase'
import type { AgeGroup, ChildProfile } from '@/lib/types'

export const AGE_GROUP_META: Record<
  AgeGroup,
  {
    label: string
    ages: string
    /** Age path main page (home) */
    dashboard: string
    /** Full progress/profile dashboard */
    profileDashboard: string
    emoji: string
    accent: string
  }
> = {
  explorer: {
    label: 'Explorer',
    ages: '6–8',
    dashboard: '/explorer',
    profileDashboard: '/explorer/dashboard',
    emoji: '🌱',
    accent: '#F5A623',
  },
  discoverer: {
    label: 'Discoverer',
    ages: '9–12',
    dashboard: '/discoverer',
    profileDashboard: '/discoverer/dashboard',
    emoji: '🔭',
    accent: '#2AAFA0',
  },
  thinker: {
    label: 'Thinker',
    ages: '13–16',
    dashboard: '/thinker',
    profileDashboard: '/thinker/dashboard',
    emoji: '🌍',
    accent: '#8B6BB1',
  },
}

export function childHomePathForAgeGroup(ageGroup: AgeGroup): string {
  return AGE_GROUP_META[ageGroup].dashboard
}

export function dashboardPathForAgeGroup(ageGroup: AgeGroup): string {
  return childHomePathForAgeGroup(ageGroup)
}

export function profileDashboardPathForAgeGroup(ageGroup: AgeGroup): string {
  return AGE_GROUP_META[ageGroup].profileDashboard
}

/** Map numeric age to YaqzaKids age band */
export function ageGroupFromAge(age: number): AgeGroup {
  if (age <= 8) return 'explorer'
  if (age <= 12) return 'discoverer'
  return 'thinker'
}

export function defaultAgeForGroup(ageGroup: AgeGroup): number {
  if (ageGroup === 'explorer') return 7
  if (ageGroup === 'discoverer') return 10
  return 14
}

export const CHILD_INTEREST_OPTIONS = [
  'Science',
  'Nature',
  'History',
  'Technology',
  'Faith',
  'Geography',
  'Art',
  'Sports',
  'Current Events',
] as const

function levelNumber(totalStars: number): number {
  let idx = 0
  for (let i = 0; i < STAR_LEVELS.length; i++) {
    if (totalStars >= STAR_LEVELS[i].min) idx = i
  }
  return idx + 1
}

export interface ChildProfileSummary {
  childId: string
  name: string
  age: number | null
  ageGroup: AgeGroup
  avatarId: string | null
  levelName: string
  levelNumber: number
  stars: number
  streak: number
  lastActiveLabel: string
  continueUrl: string | null
  dashboardPath: string
}

async function fetchLastActiveLabel(childId: string): Promise<{ label: string; url: string | null }> {
  const unfinished = await fetchLastUnfinishedArticle(childId)
  if (unfinished) {
    return { label: unfinished.title, url: unfinished.url }
  }

  const { data: progressRow } = await supabase
    .from('article_progress')
    .select('updated_at, article:articles(id, title)')
    .eq('child_profile_id', childId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const article = progressRow?.article as { id?: string; title?: string } | { id?: string; title?: string }[] | null
  const articleObj = Array.isArray(article) ? article[0] : article
  if (articleObj?.title && articleObj.id) {
    const url = await resolveArticleUrl(articleObj.id)
    return { label: articleObj.title, url }
  }

  const { data: pathRow } = await supabase
    .from('path_progress')
    .select('updated_at, path:adventure_paths(title, slug)')
    .eq('child_profile_id', childId)
    .gt('completion_percentage', 0)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const path = pathRow?.path as { title?: string; slug?: string } | { title?: string; slug?: string }[] | null
  const pathObj = Array.isArray(path) ? path[0] : path
  if (pathObj?.title && pathObj.slug) {
    return { label: pathObj.title, url: `/adventures/${pathObj.slug}` }
  }

  return { label: 'Ready to start a new adventure', url: null }
}

export async function fetchChildProfileSummary(child: ChildProfile): Promise<ChildProfileSummary> {
  const [stars, analytics, lastActive] = await Promise.all([
    fetchChildStarsTotal(child.id),
    fetchChildDashboardAnalytics(child.id),
    fetchLastActiveLabel(child.id),
  ])

  const level = getLevelProgress(stars)
  const meta = AGE_GROUP_META[child.age_group]

  return {
    childId: child.id,
    name: child.name,
    age: child.age ?? null,
    ageGroup: child.age_group,
    avatarId: child.avatar_id ?? null,
    levelName: level.currentLevel,
    levelNumber: levelNumber(stars),
    stars,
    streak: analytics.currentStreak,
    lastActiveLabel: lastActive.label,
    continueUrl: lastActive.url ?? meta.dashboard,
    dashboardPath: meta.dashboard,
  }
}

export async function fetchAllChildProfileSummaries(
  children: ChildProfile[]
): Promise<ChildProfileSummary[]> {
  return Promise.all(children.map(fetchChildProfileSummary))
}
