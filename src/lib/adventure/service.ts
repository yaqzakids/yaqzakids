import { supabase } from '../supabase'
import {
  applyPathArticleProgression,
  findNextAvailablePathArticle,
} from './articleProgression'
import type {
  AdventureArticle,
  AdventurePath,
  AdventureQuiz,
  ArticleProgress,
  Badge,
  ChildBadge,
  ChildHeroCard,
  HeroCard,
  PathArticleWithProgress,
  PathProgress,
  PathWithProgress,
  Pillar,
  QuizQuestion,
} from './types'

export type ArticlePathAccessResult =
  | {
      allowed: true
      reason: null
      articleTitle?: string
      pathTitle?: string
    }
  | {
      allowed: false
      reason: 'premium' | 'sequential' | 'not_found'
      articleTitle?: string
      pathTitle?: string
      pathSlug?: string
      previousArticle?: { title: string; slug: string }
    }

async function fetchPathArticlesForPaths(pathIds: string[]) {
  if (pathIds.length === 0) return []
  const { data, error } = await supabase
    .from('path_articles')
    .select('*, article:articles(id, title, slug)')
    .in('adventure_path_id', pathIds)
    .order('sort_order')
  if (error) throw error
  return data ?? []
}

async function fetchArticleProgressMap(childId: string, articleIds: string[]) {
  if (articleIds.length === 0) return {} as Record<string, import('./types').ArticleProgress>
  const { data, error } = await supabase
    .from('article_progress')
    .select('*')
    .eq('child_profile_id', childId)
    .in('article_id', articleIds)
  if (error) throw error
  return Object.fromEntries((data ?? []).map((row) => [row.article_id, row]))
}

export async function isPaidMember(userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_paid_member', { p_user_id: userId })
  if (error) {
    const { data: sub, error: subError } = await supabase
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle()
    if (subError || !sub) return false
    return sub.plan !== 'free'
  }
  return Boolean(data)
}

export async function canAccessPath(userId: string, pathId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('can_access_path', {
    p_user_id: userId,
    p_path_id: pathId,
  })
  if (error) {
    const { data: path } = await supabase.from('adventure_paths').select('is_free').eq('id', pathId).single()
    if (path?.is_free) return true
    return isPaidMember(userId)
  }
  return Boolean(data)
}

export async function canAccessArticle(userId: string, articleId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('can_access_article', {
    p_user_id: userId,
    p_article_id: articleId,
  })
  if (error) return isPaidMember(userId)
  return Boolean(data)
}

export async function fetchPillars(): Promise<Pillar[]> {
  const { data, error } = await supabase.from('pillars').select('*').order('sort_order')
  if (error) throw error
  return data ?? []
}

export async function fetchPathsWithProgress(
  childId: string | null,
  userId: string | null
): Promise<{ pillars: Pillar[]; paths: PathWithProgress[] }> {
  const [pillarsRes, pathsRes] = await Promise.all([
    supabase.from('pillars').select('*').order('sort_order'),
    supabase.from('adventure_paths').select('*, pillar:pillars(*), badge:badges(*)').order('sort_order'),
  ])
  if (pillarsRes.error) throw pillarsRes.error
  if (pathsRes.error) throw pathsRes.error

  let progressMap: Record<string, PathProgress> = {}
  if (childId) {
    const { data: prog } = await supabase.from('path_progress').select('*').eq('child_profile_id', childId)
    progressMap = Object.fromEntries((prog ?? []).map((p) => [p.adventure_path_id, p]))
  }

  const paid = userId ? await isPaidMember(userId) : false

  let enrichedPaths: PathWithProgress[] = (pathsRes.data ?? []).map((p) => ({
    ...p,
    pillar: p.pillar as Pillar,
    badge: p.badge as Badge | null,
    path_progress: progressMap[p.id] ?? null,
    accessible: p.is_free || paid,
  }))

  if (childId && enrichedPaths.length > 0) {
    const pathIds = enrichedPaths.map((path) => path.id)
    const allPathArticles = await fetchPathArticlesForPaths(pathIds)
    const articleIds = [...new Set(allPathArticles.map((item) => item.article_id))]
    const articleProgress = await fetchArticleProgressMap(childId, articleIds)

    enrichedPaths = enrichedPaths.map((path) => {
      const pathArticles = allPathArticles.filter((item) => item.adventure_path_id === path.id)
      const articlesWithProgress = applyPathArticleProgression(
        pathArticles,
        articleProgress,
        path.accessible,
      )
      const nextArticle = findNextAvailablePathArticle(articlesWithProgress)

      return {
        ...path,
        lessonCount: pathArticles.length || path.path_progress?.total_articles || 0,
        nextArticleTitle: nextArticle?.article?.title ?? null,
      }
    })
  } else {
    enrichedPaths = enrichedPaths.map((path) => ({
      ...path,
      lessonCount: path.path_progress?.total_articles ?? 0,
      nextArticleTitle: null,
    }))
  }

  const paths: PathWithProgress[] = enrichedPaths

  return { pillars: pillarsRes.data ?? [], paths }
}

export async function fetchPathDetail(
  pathSlug: string,
  childId: string | null,
  userId: string | null
): Promise<{
  path: AdventurePath
  articles: PathArticleWithProgress[]
  pathProgress: PathProgress | null
  accessible: boolean
} | null> {
  const { data: path, error } = await supabase
    .from('adventure_paths')
    .select('*, pillar:pillars(*), badge:badges(*)')
    .eq('slug', pathSlug)
    .single()
  if (error || !path) return null

  const paid = userId ? await isPaidMember(userId) : false
  const accessible = path.is_free || paid

  const { data: pathArticles } = await supabase
    .from('path_articles')
    .select('*, article:articles(*)')
    .eq('adventure_path_id', path.id)
    .order('sort_order')

  let articleProgress: Record<string, ArticleProgress> = {}
  let pathProgress: PathProgress | null = null

  if (childId) {
    const articleIds = (pathArticles ?? []).map((pa) => pa.article_id)
    if (articleIds.length) {
      const { data: ap } = await supabase
        .from('article_progress')
        .select('*')
        .eq('child_profile_id', childId)
        .in('article_id', articleIds)
      articleProgress = Object.fromEntries((ap ?? []).map((a) => [a.article_id, a]))
    }
    const { data: pp } = await supabase
      .from('path_progress')
      .select('*')
      .eq('child_profile_id', childId)
      .eq('adventure_path_id', path.id)
      .maybeSingle()
    pathProgress = pp
  }

  const articles: PathArticleWithProgress[] = applyPathArticleProgression(
    pathArticles ?? [],
    articleProgress,
    accessible,
  )

  return { path: path as AdventurePath, articles, pathProgress, accessible }
}

export async function fetchChildArticlePathAccess(
  pathSlug: string,
  articleSlug: string,
  childId: string,
  userId: string | null,
): Promise<ArticlePathAccessResult> {
  const detail = await fetchPathDetail(pathSlug, childId, userId)
  if (!detail) {
    return { allowed: false, reason: 'not_found' }
  }

  const pathArticle = detail.articles.find((item) => item.article?.slug === articleSlug)
  if (!pathArticle?.article) {
    return { allowed: false, reason: 'not_found' }
  }

  if (!detail.accessible) {
    return {
      allowed: false,
      reason: 'premium',
      articleTitle: pathArticle.article.title,
      pathTitle: detail.path.title,
      pathSlug: detail.path.slug,
    }
  }

  if (pathArticle.locked) {
    const previous = pathArticle.previousArticle
    return {
      allowed: false,
      reason: pathArticle.lockReason === 'premium' ? 'premium' : 'sequential',
      articleTitle: pathArticle.article.title,
      pathTitle: detail.path.title,
      pathSlug: detail.path.slug,
      previousArticle: previous?.article
        ? { title: previous.article.title, slug: previous.article.slug }
        : undefined,
    }
  }

  return {
    allowed: true,
    reason: null,
    articleTitle: pathArticle.article.title,
    pathTitle: detail.path.title,
  }
}

export async function fetchAdventureArticle(
  pathSlug: string,
  articleSlug: string
): Promise<{ path: AdventurePath; article: AdventureArticle; quiz: AdventureQuiz | null } | null> {
  const { data: path } = await supabase.from('adventure_paths').select('*').eq('slug', pathSlug).single()
  if (!path) return null

  const { data: article } = await supabase.from('articles').select('*').eq('slug', articleSlug).single()
  if (!article) return null

  const { data: quiz } = await supabase.from('quizzes').select('*').eq('article_id', article.id).maybeSingle()
  return { path, article, quiz }
}

export async function fetchQuizQuestions(quizId: string): Promise<QuizQuestion[]> {
  const { data, error } = await supabase
    .from('quiz_questions')
    .select('*')
    .eq('quiz_id', quizId)
    .order('sort_order')
  if (error) throw error
  return (data ?? []).map((q) => ({
    ...q,
    options: q.options as QuizQuestion['options'],
  }))
}

export async function fetchArticleProgress(
  childId: string,
  articleId: string
): Promise<ArticleProgress | null> {
  const { data } = await supabase
    .from('article_progress')
    .select('*')
    .eq('child_profile_id', childId)
    .eq('article_id', articleId)
    .maybeSingle()
  return data
}

/** Mark article read — triggers DB progression (10 Stars, path recalc) */
export async function markArticleRead(childId: string, articleId: string): Promise<ArticleProgress> {
  const { data, error } = await supabase.rpc('mark_article_read', {
    p_child_id: childId,
    p_article_id: articleId,
  })
  if (error) throw error
  return data as ArticleProgress
}

/** Submit quiz attempt — score >= 70% passes; awards 25 Stars on pass */
export async function submitQuizAttempt(
  childId: string,
  quizId: string,
  scorePercentage: number,
  answers: unknown
) {
  const { data, error } = await supabase.rpc('record_quiz_attempt', {
    p_child_id: childId,
    p_quiz_id: quizId,
    p_score_percentage: scorePercentage,
    p_answers: answers,
  })
  if (error) throw error
  return data
}

export async function fetchChildBadges(childId: string): Promise<ChildBadge[]> {
  const { data, error } = await supabase
    .from('child_badges')
    .select('*, badge:badges(*)')
    .eq('child_profile_id', childId)
  if (error) throw error
  return (data ?? []).map((b) => ({ ...b, badge: b.badge as Badge }))
}

export async function fetchAllBadges(): Promise<Badge[]> {
  const { data, error } = await supabase.from('badges').select('*')
  if (error) throw error
  return data ?? []
}

export async function fetchChildHeroCards(childId: string): Promise<ChildHeroCard[]> {
  const { data, error } = await supabase
    .from('child_hero_cards')
    .select('*, hero_card:hero_cards(*)')
    .eq('child_profile_id', childId)
  if (error) throw error
  return (data ?? []).map((h) => ({ ...h, hero_card: h.hero_card as HeroCard }))
}

export async function fetchAllHeroCards(): Promise<HeroCard[]> {
  const { data, error } = await supabase.from('hero_cards').select('*').order('sort_order')
  if (error) throw error
  return data ?? []
}

export async function fetchChildPoints(childId: string): Promise<number> {
  const { fetchChildStarsTotal } = await import('./engagement')
  return fetchChildStarsTotal(childId)
}

export function shuffleQuestions<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function shuffleOptions<T>(options: T[]): T[] {
  return shuffleQuestions(options)
}
