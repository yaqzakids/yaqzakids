import { supabase } from '@/lib/supabase'
import { fetchChildDashboardAnalytics, fetchChildStarsTotal } from '@/lib/adventure/engagement'
import { fetchPathsWithProgress, fetchChildBadges, fetchAllBadges } from '@/lib/adventure/service'
import { getLevelProgress } from '@/lib/adventure/levels'
import type { AdventureArticle, ChildBadge, PathWithProgress } from '@/lib/adventure/types'
import type { Certificate, Language, ReflectionResponse, UsulTheme } from '@/lib/types'

export interface ChildStats {
  stars: number
  xp: number
  level: string
  levelProgress: number
  starsToNext: number
  streak: number
  articlesRead: number
  quizzesCompleted: number
  badgesCount: number
}

export interface DailyMissionStatus {
  readStory: boolean
  passQuiz: boolean
  answerReflection: boolean
  featuredArticle: AdventureArticle | null
  reflectionQuestion: string | null
}

export interface DiscovererHomepageData {
  stats: ChildStats
  childName: string
  featuredArticle: AdventureArticle | null
  continuePaths: PathWithProgress[]
  recommendedArticles: AdventureArticle[]
  badges: ReturnType<typeof mapBadgesWithStatus>
}

export interface ParentDiscovererReport {
  childName: string
  articlesRead: number
  quizzesCompleted: number
  reflectionsAnswered: number
  starsEarned: number
  themesExplored: UsulTheme[]
  discussionPrompt: string
  certificates: Certificate[]
}

const USUL_LABELS: Record<UsulTheme, string> = {
  tawhid: 'Tawhid',
  revelation: 'Revelation',
  purpose: 'Purpose',
  akhlaq: 'Akhlaq',
  akhirah: 'Akhirah',
  stewardship: 'Stewardship',
  justice: 'Justice',
  knowledge: 'Knowledge',
}

export function usulThemeLabel(theme: UsulTheme | null | undefined): string {
  return theme ? USUL_LABELS[theme] : 'General'
}

function todayIsoDate(): string {
  return new Date().toISOString().split('T')[0]
}

function mapBadgesWithStatus(
  allBadges: Awaited<ReturnType<typeof fetchAllBadges>>,
  earnedBadges: ChildBadge[]
) {
  const earnedMap = new Map(earnedBadges.map((b) => [b.badge_id, b.awarded_at]))
  return allBadges.map((b) => ({
    ...b,
    earned: earnedMap.has(b.id),
    earnedAt: earnedMap.get(b.id),
  }))
}

export async function fetchChildStats(childProfileId: string): Promise<ChildStats> {
  const [analytics, stars] = await Promise.all([
    fetchChildDashboardAnalytics(childProfileId),
    fetchChildStarsTotal(childProfileId),
  ])
  const level = getLevelProgress(stars)
  return {
    stars,
    xp: stars,
    level: level.currentLevel,
    levelProgress: level.progressPercent,
    starsToNext: level.starsToNext,
    streak: analytics.currentStreak,
    articlesRead: analytics.articlesCompleted,
    quizzesCompleted: analytics.quizzesPassed,
    badgesCount: analytics.badgesEarned,
  }
}

async function fetchPublishedArticles(limit = 8): Promise<AdventureArticle[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as AdventureArticle[]
}

export async function fetchDiscovererHomepageData(
  childProfileId: string | null,
  userId: string | null,
  childName = 'Explorer'
): Promise<DiscovererHomepageData> {
  const defaultStats: ChildStats = {
    stars: 0,
    xp: 0,
    level: 'Seeker',
    levelProgress: 0,
    starsToNext: 100,
    streak: 0,
    articlesRead: 0,
    quizzesCompleted: 0,
    badgesCount: 0,
  }

  const [pathsResult, articles, allBadges] = await Promise.all([
    fetchPathsWithProgress(childProfileId, userId),
    fetchPublishedArticles(12),
    fetchAllBadges(),
  ])

  let stats = defaultStats
  let earnedBadges: ChildBadge[] = []
  if (childProfileId) {
    ;[stats, earnedBadges] = await Promise.all([
      fetchChildStats(childProfileId),
      fetchChildBadges(childProfileId),
    ])
  }

  const badges = mapBadgesWithStatus(allBadges, earnedBadges)

  const continuePaths = pathsResult.paths
    .filter(
      (p) =>
        (p.path_progress?.completion_percentage ?? 0) > 0 &&
        (p.path_progress?.completion_percentage ?? 0) < 100
    )
    .slice(0, 4)

  const featuredArticle = articles.find((a) => a.content_discoverer?.trim()) ?? articles[0] ?? null
  const recommendedArticles = articles.filter((a) => a.id !== featuredArticle?.id).slice(0, 4)

  return {
    stats,
    childName,
    featuredArticle,
    continuePaths,
    recommendedArticles,
    badges,
  }
}

export async function fetchDailyMission(childProfileId: string): Promise<DailyMissionStatus> {
  const today = todayIsoDate()

  const [articlesRes, quizRes, reflectionRes] = await Promise.all([
    supabase
      .from('article_progress')
      .select('id')
      .eq('child_profile_id', childProfileId)
      .eq('read_completed', true)
      .gte('completed_at', `${today}T00:00:00`),
    supabase
      .from('quiz_attempts')
      .select('id')
      .eq('child_profile_id', childProfileId)
      .eq('passed', true)
      .gte('created_at', `${today}T00:00:00`),
    supabase
      .from('reflection_responses')
      .select('id')
      .eq('child_profile_id', childProfileId)
      .gte('created_at', `${today}T00:00:00`),
  ])

  const featured = (await fetchPublishedArticles(1))[0] ?? null

  return {
    readStory: (articlesRes.data?.length ?? 0) > 0,
    passQuiz: (quizRes.data?.length ?? 0) > 0,
    answerReflection: (reflectionRes.data?.length ?? 0) > 0,
    featuredArticle: featured,
    reflectionQuestion: featured?.reflection_question ?? featured?.think_about_it?.[0] ?? null,
  }
}

export async function fetchChildBadgesWithStatus(childProfileId: string) {
  const [all, earned] = await Promise.all([fetchAllBadges(), fetchChildBadges(childProfileId)])
  return mapBadgesWithStatus(all, earned)
}

export async function fetchChildCertificates(childProfileId: string): Promise<Certificate[]> {
  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .eq('child_profile_id', childProfileId)
    .order('completed_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Certificate[]
}

export async function checkAndAwardCertificate(
  childProfileId: string,
  childName: string,
  pathId: string,
  pathName: string
): Promise<Certificate | null> {
  const { data: existing } = await supabase
    .from('certificates')
    .select('id')
    .eq('child_profile_id', childProfileId)
    .eq('path_id', pathId)
    .maybeSingle()
  if (existing) return null

  const { data: progress } = await supabase
    .from('path_progress')
    .select('completion_percentage, completed')
    .eq('child_profile_id', childProfileId)
    .eq('adventure_path_id', pathId)
    .maybeSingle()

  if (!progress?.completed && (progress?.completion_percentage ?? 0) < 100) return null

  const { data, error } = await supabase
    .from('certificates')
    .insert({
      child_profile_id: childProfileId,
      path_id: pathId,
      child_name: childName,
      path_name: pathName,
    })
    .select('*')
    .single()
  if (error) throw error
  return data as Certificate
}

export async function saveReflectionResponse(
  childProfileId: string,
  articleId: string,
  response: string
): Promise<ReflectionResponse> {
  const { data, error } = await supabase
    .from('reflection_responses')
    .insert({ child_profile_id: childProfileId, article_id: articleId, response: response.trim() })
    .select('*')
    .single()
  if (error) throw error
  return data as ReflectionResponse
}

export async function fetchParentReport(
  _parentUserId: string,
  childProfileId: string,
  childName: string
): Promise<ParentDiscovererReport> {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const [analytics, reflectionsRes, certs, articlesRes] = await Promise.all([
    fetchChildDashboardAnalytics(childProfileId),
    supabase
      .from('reflection_responses')
      .select('id', { count: 'exact', head: true })
      .eq('child_profile_id', childProfileId)
      .gte('created_at', weekAgo.toISOString()),
    fetchChildCertificates(childProfileId),
    supabase
      .from('article_progress')
      .select('article:articles(usul_theme, title)')
      .eq('child_profile_id', childProfileId)
      .eq('read_completed', true)
      .gte('completed_at', weekAgo.toISOString()),
  ])

  const themes = new Set<UsulTheme>()
  for (const row of articlesRes.data ?? []) {
    const article = row.article as { usul_theme?: UsulTheme } | null
    if (article?.usul_theme) themes.add(article.usul_theme)
  }

  return {
    childName,
    articlesRead: analytics.articlesCompleted,
    quizzesCompleted: analytics.quizzesPassed,
    reflectionsAnswered: reflectionsRes.count ?? 0,
    starsEarned: analytics.totalStars,
    themesExplored: [...themes],
    discussionPrompt:
      'How can we show gratitude for the amazing things Allah created in nature?',
    certificates: certs,
  }
}

export function pickLocalizedField(
  base: string | null | undefined,
  i18n: Record<string, string> | null | undefined,
  language: Language
): string {
  const localized = i18n?.[language]?.trim()
  if (localized) return localized
  if (language !== 'en' && i18n?.en?.trim()) return i18n.en
  return base?.trim() ?? ''
}

export function pickLocalizedThinkAbout(
  base: string[] | null | undefined,
  i18n: Record<string, string[]> | null | undefined,
  language: Language
): string[] {
  const localized = i18n?.[language]?.filter(Boolean)
  if (localized?.length) return localized
  if (language !== 'en' && i18n?.en?.filter(Boolean).length) return i18n.en.filter(Boolean)
  return base?.filter(Boolean) ?? []
}

export const DISCOVERER_BADGE_DISPLAY = [
  { slug: 'curious-explorer', name: 'Curious Explorer', icon: '🔬', color: '#F5A623' },
  { slug: 'star-reader', name: 'Star Reader', icon: '⭐', color: '#2AAFA0' },
  { slug: 'nature-helper', name: 'Nature Helper', icon: '🌿', color: '#4AAE8A' },
  { slug: 'quiz-whiz', name: 'Quiz Whiz', icon: '❓', color: '#8B6BB1' },
  { slug: 'reflection-thinker', name: 'Reflection Thinker', icon: '💭', color: '#E85D4A' },
  { slug: 'mission-master', name: 'Mission Master', icon: '🎯', color: '#1B2F5E' },
] as const

export const DISCOVERER_PATH_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'science', label: 'Science' },
  { id: 'history', label: 'History' },
  { id: 'current', label: 'Current Events' },
  { id: 'technology', label: 'Technology' },
  { id: 'geography', label: 'Geography' },
  { id: 'environment', label: 'Environment' },
  { id: 'faith', label: 'Faith' },
] as const
