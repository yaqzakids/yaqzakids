import { supabase } from '@/lib/supabase'
import { getLevelProgress } from '@/lib/adventure/levels'
import { resetChildProgress } from '@/lib/admin/children'
import type { AgeGroup } from '@/lib/types'

export type ActivityStatus = 'active' | 'inactive' | 'never'

export interface ProgressOverviewStats {
  totalChildren: number
  activeChildren: number
  totalArticlesCompleted: number
  totalQuizzesPassed: number
  totalStarsEarned: number
  totalBadgesAwarded: number
  averageCompletionRate: number
}

export interface ProgressChildRow {
  id: string
  name: string
  parentEmail: string | null
  parentName: string | null
  ageGroup: AgeGroup
  stars: number
  currentStreak: number
  articlesCompleted: number
  quizzesPassed: number
  badgesEarned: number
  levelName: string
  lastActive: string | null
  activityStatus: ActivityStatus
  pathIds: string[]
}

export interface ProgressPathRow {
  pathId: string
  pathName: string
  progressPercent: number
  completedArticles: number
  totalArticles: number
  completed: boolean
}

export interface ProgressBadgeRow {
  id: string
  name: string
  icon: string | null
  awardedAt: string
}

export interface ProgressHeroCardRow {
  id: string
  name: string
  unlockedAt: string
}

export interface ProgressActivityRow {
  id: string
  type: 'article' | 'quiz' | 'badge' | 'path'
  label: string
  occurredAt: string
}

export interface ProgressChildDetail {
  id: string
  name: string
  parentName: string | null
  parentEmail: string | null
  ageGroup: AgeGroup
  joinDate: string | null
  totalStars: number
  currentStreak: number
  longestStreak: number
  articlesCompleted: number
  quizzesPassed: number
  badgesEarned: number
  heroCardsUnlocked: number
  levelName: string
  paths: ProgressPathRow[]
  badges: ProgressBadgeRow[]
  heroCards: ProgressHeroCardRow[]
  recentActivity: ProgressActivityRow[]
}

export interface ProgressLeaderboardEntry {
  rank: number
  childId: string
  name: string
  stars: number
  levelName: string
}

export interface PopularContentStats {
  topArticles: { id: string; title: string; count: number }[]
  topPaths: { id: string; title: string; count: number }[]
  topBadges: { id: string; name: string; icon: string | null; count: number }[]
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

function weekAgoIso(): string {
  return new Date(Date.now() - WEEK_MS).toISOString()
}

function weekAgoDate(): string {
  const d = new Date(Date.now() - WEEK_MS)
  return d.toISOString().slice(0, 10)
}

function maxIsoDate(...values: (string | null | undefined)[]): string | null {
  const dates = values.filter(Boolean).map((v) => new Date(v!).getTime()).filter((t) => !Number.isNaN(t))
  if (dates.length === 0) return null
  return new Date(Math.max(...dates)).toISOString()
}

function deriveActivityStatus(hasProgress: boolean, lastActive: string | null): ActivityStatus {
  if (!hasProgress) return 'never'
  if (!lastActive) return 'inactive'
  const activeSince = Date.now() - WEEK_MS
  return new Date(lastActive).getTime() >= activeSince ? 'active' : 'inactive'
}

export async function fetchProgressOverview(): Promise<ProgressOverviewStats> {
  const weekAgo = weekAgoIso()
  const weekAgoDay = weekAgoDate()

  const [
    childrenRes,
    articleProgRes,
    quizPassedRes,
    badgesRes,
    pathProgRes,
    activeArticleRes,
    activePointsRes,
    activeStreakRes,
  ] = await Promise.all([
    supabase.from('child_profiles').select('id, points'),
    supabase
      .from('article_progress')
      .select('id', { count: 'exact', head: true })
      .eq('read_completed', true)
      .eq('quiz_passed', true),
    supabase
      .from('article_progress')
      .select('id', { count: 'exact', head: true })
      .eq('quiz_passed', true),
    supabase.from('child_badges').select('id', { count: 'exact', head: true }),
    supabase.from('path_progress').select('completed_articles, total_articles, completion_percentage'),
    supabase.from('article_progress').select('child_profile_id').gte('updated_at', weekAgo),
    supabase.from('points_ledger').select('child_profile_id').gte('created_at', weekAgo),
    supabase.from('child_streaks').select('child_profile_id').gte('last_activity_date', weekAgoDay),
  ])

  if (childrenRes.error) throw childrenRes.error
  if (articleProgRes.error) throw articleProgRes.error
  if (quizPassedRes.error) throw quizPassedRes.error
  if (badgesRes.error) throw badgesRes.error
  if (pathProgRes.error) throw pathProgRes.error

  const children = childrenRes.data ?? []
  const activeIds = new Set<string>()
  ;(activeArticleRes.data ?? []).forEach((r) => activeIds.add(r.child_profile_id))
  ;(activePointsRes.data ?? []).forEach((r) => activeIds.add(r.child_profile_id))
  ;(activeStreakRes.data ?? []).forEach((r) => activeIds.add(r.child_profile_id))

  const pathRows = pathProgRes.data ?? []
  const totalArticlesInPaths = pathRows.reduce((s, r) => s + (r.total_articles ?? 0), 0)
  const completedArticlesInPaths = pathRows.reduce((s, r) => s + (r.completed_articles ?? 0), 0)
  const averageCompletionRate =
    totalArticlesInPaths > 0
      ? Math.round((completedArticlesInPaths / totalArticlesInPaths) * 100)
      : pathRows.length > 0
        ? Math.round(pathRows.reduce((s, r) => s + Number(r.completion_percentage ?? 0), 0) / pathRows.length)
        : 0

  return {
    totalChildren: children.length,
    activeChildren: activeIds.size,
    totalArticlesCompleted: articleProgRes.count ?? 0,
    totalQuizzesPassed: quizPassedRes.count ?? 0,
    totalStarsEarned: children.reduce((s, c) => s + (c.points ?? 0), 0),
    totalBadgesAwarded: badgesRes.count ?? 0,
    averageCompletionRate,
  }
}

export async function fetchProgressChildren(): Promise<ProgressChildRow[]> {
  const { data: children, error } = await supabase
    .from('child_profiles')
    .select('id, name, age_group, points, parent:profiles(full_name, email)')
    .order('name')

  if (error) throw error
  if (!children?.length) return []

  const childIds = children.map((c) => c.id)

  const [streaksRes, articleProgRes, quizPassedRes, badgesRes, pathProgRes, activityRes, pointsRes] =
    await Promise.all([
      supabase.from('child_streaks').select('child_profile_id, current_streak, last_activity_date').in('child_profile_id', childIds),
      supabase
        .from('article_progress')
        .select('child_profile_id, updated_at')
        .in('child_profile_id', childIds)
        .eq('read_completed', true)
        .eq('quiz_passed', true),
      supabase
        .from('article_progress')
        .select('child_profile_id')
        .in('child_profile_id', childIds)
        .eq('quiz_passed', true),
      supabase.from('child_badges').select('child_profile_id').in('child_profile_id', childIds),
      supabase.from('path_progress').select('child_profile_id, adventure_path_id, updated_at').in('child_profile_id', childIds),
      supabase
        .from('article_progress')
        .select('child_profile_id, updated_at, created_at')
        .in('child_profile_id', childIds),
      supabase.from('points_ledger').select('child_profile_id, created_at').in('child_profile_id', childIds),
    ])

  const streakMap = Object.fromEntries((streaksRes.data ?? []).map((s) => [s.child_profile_id, s]))
  const articleCounts: Record<string, number> = {}
  const quizCounts: Record<string, number> = {}
  const badgeCounts: Record<string, number> = {}
  const pathIdsMap: Record<string, Set<string>> = {}
  const lastActiveMap: Record<string, string | null> = {}
  const hasProgressMap: Record<string, boolean> = {}

  const bumpLastActive = (childId: string, ...dates: (string | null | undefined)[]) => {
    const next = maxIsoDate(lastActiveMap[childId], ...dates)
    if (next) lastActiveMap[childId] = next
  }

  ;(articleProgRes.data ?? []).forEach((r) => {
    articleCounts[r.child_profile_id] = (articleCounts[r.child_profile_id] ?? 0) + 1
    hasProgressMap[r.child_profile_id] = true
    bumpLastActive(r.child_profile_id, r.updated_at)
  })

  ;(quizPassedRes.data ?? []).forEach((r) => {
    quizCounts[r.child_profile_id] = (quizCounts[r.child_profile_id] ?? 0) + 1
    hasProgressMap[r.child_profile_id] = true
  })

  ;(badgesRes.data ?? []).forEach((r) => {
    badgeCounts[r.child_profile_id] = (badgeCounts[r.child_profile_id] ?? 0) + 1
    hasProgressMap[r.child_profile_id] = true
  })

  ;(pathProgRes.data ?? []).forEach((r) => {
    if (!pathIdsMap[r.child_profile_id]) pathIdsMap[r.child_profile_id] = new Set()
    pathIdsMap[r.child_profile_id].add(r.adventure_path_id)
    hasProgressMap[r.child_profile_id] = true
    bumpLastActive(r.child_profile_id, r.updated_at)
  })

  ;(activityRes.data ?? []).forEach((r) => {
    hasProgressMap[r.child_profile_id] = true
    bumpLastActive(r.child_profile_id, r.updated_at, r.created_at)
  })

  ;(pointsRes.data ?? []).forEach((r) => {
    hasProgressMap[r.child_profile_id] = true
    bumpLastActive(r.child_profile_id, r.created_at)
  })

  return children.map((c) => {
    const parent = (Array.isArray(c.parent) ? c.parent[0] : c.parent) as { full_name: string; email: string | null } | null
    const streak = streakMap[c.id]
    const stars = c.points ?? 0
    const lastActive = maxIsoDate(
      lastActiveMap[c.id],
      streak?.last_activity_date ? `${streak.last_activity_date}T12:00:00.000Z` : null,
    )

    return {
      id: c.id,
      name: c.name,
      parentEmail: parent?.email ?? null,
      parentName: parent?.full_name ?? null,
      ageGroup: c.age_group as AgeGroup,
      stars,
      currentStreak: streak?.current_streak ?? 0,
      articlesCompleted: articleCounts[c.id] ?? 0,
      quizzesPassed: quizCounts[c.id] ?? 0,
      badgesEarned: badgeCounts[c.id] ?? 0,
      levelName: getLevelProgress(stars).currentLevel,
      lastActive,
      activityStatus: deriveActivityStatus(!!hasProgressMap[c.id], lastActive),
      pathIds: [...(pathIdsMap[c.id] ?? [])],
    }
  })
}

export async function fetchProgressChildDetail(childId: string): Promise<ProgressChildDetail> {
  const { data: child, error } = await supabase
    .from('child_profiles')
    .select('id, name, age_group, points, parent:profiles(full_name, email, created_at)')
    .eq('id', childId)
    .single()

  if (error) throw error

  const parent = (Array.isArray(child.parent) ? child.parent[0] : child.parent) as {
    full_name: string
    email: string | null
    created_at: string
  } | null

  const [
    streakRes,
    pathsRes,
    badgesRes,
    heroRes,
    completedArticlesRes,
    quizPassedRes,
    articleActivityRes,
    quizActivityRes,
    pathActivityRes,
    firstActivityRes,
  ] = await Promise.all([
    supabase.from('child_streaks').select('*').eq('child_profile_id', childId).maybeSingle(),
    supabase
      .from('path_progress')
      .select('adventure_path_id, completion_percentage, completed_articles, total_articles, completed, completed_at, updated_at, path:adventure_paths(title)')
      .eq('child_profile_id', childId)
      .order('updated_at', { ascending: false }),
    supabase
      .from('child_badges')
      .select('id, awarded_at, badge:badges(name, icon)')
      .eq('child_profile_id', childId)
      .order('awarded_at', { ascending: false }),
    supabase
      .from('child_hero_cards')
      .select('id, unlocked_at, hero:hero_cards(name)')
      .eq('child_profile_id', childId)
      .order('unlocked_at', { ascending: false }),
    supabase
      .from('article_progress')
      .select('id', { count: 'exact', head: true })
      .eq('child_profile_id', childId)
      .eq('read_completed', true)
      .eq('quiz_passed', true),
    supabase
      .from('article_progress')
      .select('id', { count: 'exact', head: true })
      .eq('child_profile_id', childId)
      .eq('quiz_passed', true),
    supabase
      .from('article_progress')
      .select('id, completed_at, updated_at, article:articles(title)')
      .eq('child_profile_id', childId)
      .eq('read_completed', true)
      .eq('quiz_passed', true)
      .order('updated_at', { ascending: false })
      .limit(20),
    supabase
      .from('quiz_attempts')
      .select('id, created_at, passed, quiz:quizzes(title, article:articles(title))')
      .eq('child_profile_id', childId)
      .eq('passed', true)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('path_progress')
      .select('id, completed_at, updated_at, completed, path:adventure_paths(title)')
      .eq('child_profile_id', childId)
      .eq('completed', true)
      .order('updated_at', { ascending: false })
      .limit(20),
    supabase
      .from('article_progress')
      .select('created_at')
      .eq('child_profile_id', childId)
      .order('created_at', { ascending: true })
      .limit(1),
  ])

  const stars = child.points ?? 0
  const streak = streakRes.data

  const paths: ProgressPathRow[] = (pathsRes.data ?? []).map((row) => {
    const path = (Array.isArray(row.path) ? row.path[0] : row.path) as { title: string } | null
    return {
      pathId: row.adventure_path_id,
      pathName: path?.title ?? 'Path',
      progressPercent: Number(row.completion_percentage ?? 0),
      completedArticles: row.completed_articles ?? 0,
      totalArticles: row.total_articles ?? 0,
      completed: row.completed ?? false,
    }
  })

  const badges: ProgressBadgeRow[] = (badgesRes.data ?? []).map((row) => {
    const badge = (Array.isArray(row.badge) ? row.badge[0] : row.badge) as { name: string; icon: string | null } | null
    return {
      id: row.id,
      name: badge?.name ?? 'Badge',
      icon: badge?.icon ?? null,
      awardedAt: row.awarded_at,
    }
  })

  const heroCards: ProgressHeroCardRow[] = (heroRes.data ?? []).map((row) => {
    const hero = (Array.isArray(row.hero) ? row.hero[0] : row.hero) as { name: string } | null
    return {
      id: row.id,
      name: hero?.name ?? 'Hero Card',
      unlockedAt: row.unlocked_at,
    }
  })

  const recentActivity: ProgressActivityRow[] = []

  ;(articleActivityRes.data ?? []).forEach((row) => {
    const article = (Array.isArray(row.article) ? row.article[0] : row.article) as { title: string } | null
    recentActivity.push({
      id: `article-${row.id}`,
      type: 'article',
      label: article?.title ?? 'Article completed',
      occurredAt: row.completed_at ?? row.updated_at,
    })
  })

  ;(quizActivityRes.data ?? []).forEach((row) => {
    const quiz = (Array.isArray(row.quiz) ? row.quiz[0] : row.quiz) as {
      title?: string
      article?: { title: string } | { title: string }[]
    } | null
    const article = quiz?.article
      ? (Array.isArray(quiz.article) ? quiz.article[0] : quiz.article)
      : null
    recentActivity.push({
      id: `quiz-${row.id}`,
      type: 'quiz',
      label: article?.title ? `Quiz passed: ${article.title}` : quiz?.title ? `Quiz passed: ${quiz.title}` : 'Quiz passed',
      occurredAt: row.created_at,
    })
  })

  badges.forEach((b) => {
    recentActivity.push({
      id: `badge-${b.id}`,
      type: 'badge',
      label: `Badge earned: ${b.name}`,
      occurredAt: b.awardedAt,
    })
  })

  ;(pathActivityRes.data ?? []).forEach((row) => {
    const path = (Array.isArray(row.path) ? row.path[0] : row.path) as { title: string } | null
    recentActivity.push({
      id: `path-${row.id}`,
      type: 'path',
      label: `Path completed: ${path?.title ?? 'Adventure path'}`,
      occurredAt: row.completed_at ?? row.updated_at,
    })
  })

  recentActivity.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())

  const firstActivity = firstActivityRes.data?.[0]?.created_at ?? null

  return {
    id: child.id,
    name: child.name,
    parentName: parent?.full_name ?? null,
    parentEmail: parent?.email ?? null,
    ageGroup: child.age_group as AgeGroup,
    joinDate: firstActivity ?? parent?.created_at ?? null,
    totalStars: stars,
    currentStreak: streak?.current_streak ?? 0,
    longestStreak: streak?.longest_streak ?? 0,
    articlesCompleted: completedArticlesRes.count ?? 0,
    quizzesPassed: quizPassedRes.count ?? 0,
    badgesEarned: badges.length,
    heroCardsUnlocked: heroCards.length,
    levelName: getLevelProgress(stars).currentLevel,
    paths,
    badges,
    heroCards,
    recentActivity: recentActivity.slice(0, 15),
  }
}

export async function fetchProgressLeaderboard(): Promise<ProgressLeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('child_profiles')
    .select('id, name, points')
    .order('points', { ascending: false })
    .limit(10)

  if (error) throw error

  return (data ?? []).map((row, index) => ({
    rank: index + 1,
    childId: row.id,
    name: row.name,
    stars: row.points ?? 0,
    levelName: getLevelProgress(row.points ?? 0).currentLevel,
  }))
}

export async function fetchPopularContent(): Promise<PopularContentStats> {
  const [articlesRes, pathsRes, badgesRes] = await Promise.all([
    supabase
      .from('article_progress')
      .select('article_id, article:articles(title)')
      .eq('read_completed', true)
      .eq('quiz_passed', true),
    supabase.from('path_progress').select('adventure_path_id, path:adventure_paths(title)').eq('completed', true),
    supabase.from('child_badges').select('badge_id, badge:badges(name, icon)'),
  ])

  if (articlesRes.error) throw articlesRes.error
  if (pathsRes.error) throw pathsRes.error
  if (badgesRes.error) throw badgesRes.error

  const articleCounts: Record<string, { title: string; count: number }> = {}
  ;(articlesRes.data ?? []).forEach((row) => {
    const article = (Array.isArray(row.article) ? row.article[0] : row.article) as { title: string } | null
    if (!articleCounts[row.article_id]) {
      articleCounts[row.article_id] = { title: article?.title ?? 'Article', count: 0 }
    }
    articleCounts[row.article_id].count += 1
  })

  const pathCounts: Record<string, { title: string; count: number }> = {}
  ;(pathsRes.data ?? []).forEach((row) => {
    const path = (Array.isArray(row.path) ? row.path[0] : row.path) as { title: string } | null
    if (!pathCounts[row.adventure_path_id]) {
      pathCounts[row.adventure_path_id] = { title: path?.title ?? 'Path', count: 0 }
    }
    pathCounts[row.adventure_path_id].count += 1
  })

  const badgeCounts: Record<string, { name: string; icon: string | null; count: number }> = {}
  ;(badgesRes.data ?? []).forEach((row) => {
    const badge = (Array.isArray(row.badge) ? row.badge[0] : row.badge) as { name: string; icon: string | null } | null
    if (!badgeCounts[row.badge_id]) {
      badgeCounts[row.badge_id] = { name: badge?.name ?? 'Badge', icon: badge?.icon ?? null, count: 0 }
    }
    badgeCounts[row.badge_id].count += 1
  })

  const topArticles = Object.entries(articleCounts)
    .map(([id, v]) => ({ id, title: v.title, count: v.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const topPaths = Object.entries(pathCounts)
    .map(([id, v]) => ({ id, title: v.title, count: v.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const topBadges = Object.entries(badgeCounts)
    .map(([id, v]) => ({ id, name: v.name, icon: v.icon, count: v.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return { topArticles, topPaths, topBadges }
}

export async function fetchProgressPathOptions(): Promise<{ id: string; title: string }[]> {
  const { data, error } = await supabase.from('adventure_paths').select('id, title').order('title')
  if (error) throw error
  return data ?? []
}

export { resetChildProgress }
