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
    discussionPrompt: 'How can knowledge help us serve others?',
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

export function nextStarMilestone(stars: number): number {
  const milestones = [100, 200, 300, 400, 500, 600, 750, 1000, 1500, 2000]
  return milestones.find((m) => m > stars) ?? stars + 100
}

export interface LastUnfinishedArticle {
  title: string
  url: string
  statusLabel: string
}

function unwrapJoin<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

export async function fetchLastUnfinishedArticle(
  childProfileId: string
): Promise<LastUnfinishedArticle | null> {
  const { data, error } = await supabase
    .from('article_progress')
    .select('read_completed, quiz_passed, updated_at, article:articles(id, title, slug, published)')
    .eq('child_profile_id', childProfileId)
    .or('read_completed.eq.false,quiz_passed.eq.false')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const article = unwrapJoin(data?.article as { id: string; title: string; published?: boolean } | { id: string; title: string; published?: boolean }[] | null)
  if (error || !article) return null
  if (!article.published) return null

  const url = await resolveArticleUrl(article.id)
  if (!url) return null

  const statusLabel = !data!.read_completed ? 'Story in progress' : 'Quiz remaining'
  return { title: article.title, url, statusLabel }
}

export async function fetchSampleDiscovererArticles(): Promise<
  { article: AdventureArticle; url: string | null; pathName: string }[]
> {
  const { data: freePaths } = await supabase
    .from('adventure_paths')
    .select('id, title')
    .eq('is_free', true)
    .order('sort_order')

  const pathIds = (freePaths ?? []).map((p) => p.id)
  const pathTitleById = Object.fromEntries((freePaths ?? []).map((p) => [p.id, p.title]))

  if (pathIds.length === 0) {
    const articles = await fetchPublishedArticles(6)
    return articles
      .filter((a) => a.content_discoverer?.trim())
      .map((article) => ({ article, url: null, pathName: 'Discoverer' }))
  }

  const { data: rows, error } = await supabase
    .from('path_articles')
    .select('adventure_path_id, article:articles(*), path:adventure_paths(slug)')
    .in('adventure_path_id', pathIds)
    .order('sort_order')

  if (error) throw error

  const seen = new Set<string>()
  const results: { article: AdventureArticle; url: string | null; pathName: string }[] = []

  for (const row of rows ?? []) {
    const article = unwrapJoin(row.article as AdventureArticle | AdventureArticle[] | null)
    if (!article?.published || !article.content_discoverer?.trim() || seen.has(article.id)) continue
    seen.add(article.id)

    const path = unwrapJoin(row.path as { slug?: string } | { slug?: string }[] | null)
    const url =
      path?.slug && article.slug
        ? `/adventures/${path.slug}/${article.slug}`
        : await resolveArticleUrl(article.id)

    results.push({
      article,
      url,
      pathName: pathTitleById[row.adventure_path_id as string] ?? 'Sample',
    })
    if (results.length >= 9) break
  }

  return results
}

export async function resolveArticleUrl(articleId: string): Promise<string | null> {
  const { data } = await supabase
    .from('path_articles')
    .select('article:articles(slug), path:adventure_paths(slug)')
    .eq('article_id', articleId)
    .limit(1)
    .maybeSingle()
  if (!data) return null
  const article = data.article as { slug?: string } | null
  const path = data.path as { slug?: string } | null
  if (!article?.slug || !path?.slug) return null
  return `/adventures/${path.slug}/${article.slug}`
}

export async function fetchRelatedDiscovererArticles(
  articleId: string,
  limit = 4
): Promise<AdventureArticle[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('published', true)
    .neq('id', articleId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as AdventureArticle[]
}

export const FAITH_CARDS = [
  { icon: '🌟', title: 'Wonder at Creation', text: "Science helps us discover Allah's signs." },
  { icon: '📖', title: 'Guided by Revelation', text: 'The Quran helps us understand life.' },
  { icon: '⚡', title: 'Character in Action', text: 'Knowledge should make us better people.' },
  { icon: '🎯', title: 'Purposeful Learning', text: 'Learning is a trust and a way to serve others.' },
] as const

export const LEARNING_PATHS_HOME = [
  { emoji: '🔬', name: 'Science & Nature', border: 'border-teal', articles: 5, slug: 'science-nature' },
  { emoji: '🏛️', name: 'History & Civilization', border: 'border-[#F5A623]', articles: 5, slug: 'history' },
  { emoji: '📰', name: 'Current Events', border: 'border-[#E85D4A]', articles: 5, slug: 'current-events' },
  { emoji: '🤖', name: 'Technology & AI', border: 'border-[#8B6BB1]', articles: 5, slug: 'technology' },
  { emoji: '🌍', name: 'Geography & Cultures', border: 'border-[#1B2F5E]', articles: 5, slug: 'geography' },
  { emoji: '🌱', name: 'Environment', border: 'border-green-500', articles: 5, slug: 'environment' },
  { emoji: '✨', name: 'Foundations of Faith', border: 'border-[#F5A623]', articles: 5, slug: 'faith' },
] as const

export const DISCOVERER_BADGE_DISPLAY = [
  {
    slug: 'curious-explorer',
    name: 'Curious Explorer',
    icon: '🔬',
    color: '#F5A623',
    description: 'You love asking questions and exploring new topics.',
    requirement: 'Read 10 stories across different paths.',
  },
  {
    slug: 'star-reader',
    name: 'Star Reader',
    icon: '⭐',
    color: '#2AAFA0',
    description: 'Reading is your superpower — keep turning pages!',
    requirement: 'Earn 500 stars from reading articles.',
  },
  {
    slug: 'nature-helper',
    name: 'Nature Helper',
    icon: '🌿',
    color: '#4AAE8A',
    description: 'You care for Allah\'s creation and learn from nature.',
    requirement: 'Complete 3 Science & Nature path articles.',
  },
  {
    slug: 'quiz-whiz',
    name: 'Quiz Whiz',
    icon: '❓',
    color: '#8B6BB1',
    description: 'You ace quizzes and love testing what you know.',
    requirement: 'Pass 5 quizzes with 80% or higher.',
  },
  {
    slug: 'reflection-thinker',
    name: 'Reflection Thinker',
    icon: '💭',
    color: '#E85D4A',
    description: 'You think deeply about faith and the world around you.',
    requirement: 'Answer 5 reflection questions.',
  },
  {
    slug: 'mission-master',
    name: 'Mission Master',
    icon: '🎯',
    color: '#1B2F5E',
    description: 'You complete daily missions like a champion!',
    requirement: 'Finish 7 daily missions in a row.',
  },
] as const

export type DiscovererBadgeDisplay = (typeof DISCOVERER_BADGE_DISPLAY)[number]

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
