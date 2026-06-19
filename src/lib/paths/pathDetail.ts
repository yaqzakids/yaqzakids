import { supabase } from '@/lib/supabase'
import { fetchPathDetail } from '@/lib/adventure/service'
import type { AdventurePath, PathArticleWithProgress, PathProgress } from '@/lib/adventure/types'
import {
  getLearningPathBySlug,
  LEARNING_PATHS,
  type LearningPathDefinition,
} from '@/lib/learningPaths'

export interface LearningPathPageData {
  marketing: LearningPathDefinition
  adventurePath: AdventurePath | null
  articles: PathArticleWithProgress[]
  pathProgress: PathProgress | null
  accessible: boolean
  adventureSlug: string | null
  publicSlug: string
  quizScores: Record<string, number>
  starsEarned: number
}

type ExtendedPath = AdventurePath & {
  public_slug?: string | null
  mission_statement?: string | null
  full_description?: string | null
  icon?: string | null
  status?: string | null
  certificate_enabled?: boolean | null
  certificate_title?: string | null
  age_groups?: string[] | null
}

async function fetchAdventurePathBySlugOrPublicSlug(pathSlug: string): Promise<ExtendedPath | null> {
  const { data: bySlug } = await supabase
    .from('adventure_paths')
    .select('*, pillar:pillars(*), badge:badges(*)')
    .eq('slug', pathSlug)
    .maybeSingle()

  if (bySlug) return bySlug as ExtendedPath

  const { data: byPublic, error: publicError } = await supabase
    .from('adventure_paths')
    .select('*, pillar:pillars(*), badge:badges(*)')
    .eq('public_slug', pathSlug)
    .maybeSingle()

  if (!publicError && byPublic) return byPublic as ExtendedPath

  const marketing = getLearningPathBySlug(pathSlug)
  if (marketing) {
    return fetchAdventurePathBySlugOrPublicSlug(marketing.adventureSlug)
  }

  return null
}

function marketingForSlug(pathSlug: string, path: ExtendedPath | null): LearningPathDefinition {
  const fromCatalog = getLearningPathBySlug(pathSlug)
  if (fromCatalog) return fromCatalog

  const fromPublic = LEARNING_PATHS.find((p) => p.adventureSlug === path?.slug)
  if (fromPublic) return fromPublic

  return {
    name: path?.title ?? pathSlug,
    slug: pathSlug,
    icon: path?.icon ?? '🗺️',
    color: path?.pillar?.color ?? '#2AAFA0',
    description: path?.description ?? '',
    mission: path?.mission_statement ?? path?.description ?? '',
    whatYouLearn: path?.full_description
      ? path.full_description.split('\n').filter(Boolean).slice(0, 6)
      : ['Guided lessons with quizzes', 'Age-appropriate content', 'Islamic reflection built in'],
    sampleLessons: [],
    ageGroups: ['Explorer', 'Discoverer', 'Thinker'],
    islamicThemes: ['Purposeful learning', 'Faith-connected knowledge', 'Character growth'],
    adventureSlug: path?.slug ?? pathSlug,
    coverImageUrl: path?.cover_image_url ?? '',
  }
}

async function fetchQuizScores(childId: string, articleIds: string[]): Promise<Record<string, number>> {
  if (articleIds.length === 0) return {}

  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('id, article_id')
    .in('article_id', articleIds)

  const quizIds = (quizzes ?? []).map((q) => q.id)
  if (quizIds.length === 0) return {}

  const { data: attempts } = await supabase
    .from('quiz_attempts')
    .select('quiz_id, score_percentage, passed')
    .eq('child_profile_id', childId)
    .in('quiz_id', quizIds)
    .order('score_percentage', { ascending: false })

  const quizToArticle = Object.fromEntries((quizzes ?? []).map((q) => [q.id, q.article_id]))
  const scores: Record<string, number> = {}
  for (const attempt of attempts ?? []) {
    const articleId = quizToArticle[attempt.quiz_id]
    if (!articleId || scores[articleId] != null) continue
    if (attempt.passed) scores[articleId] = attempt.score_percentage
  }
  return scores
}

export async function fetchLearningPathPageData(
  pathSlug: string,
  childId: string | null,
  userId: string | null,
): Promise<LearningPathPageData | null> {
  const adventurePath = await fetchAdventurePathBySlugOrPublicSlug(pathSlug)
  const marketing = marketingForSlug(pathSlug, adventurePath)

  if (!adventurePath && !getLearningPathBySlug(pathSlug)) {
    return null
  }

  const publicSlug = getLearningPathBySlug(pathSlug)?.slug ?? pathSlug
  const resolvedSlug = adventurePath?.slug ?? marketing.adventureSlug

  if (!adventurePath) {
    return {
      marketing,
      adventurePath: null,
      articles: [],
      pathProgress: null,
      accessible: true,
      adventureSlug: null,
      publicSlug,
      quizScores: {},
      starsEarned: 0,
    }
  }

  const detail = await fetchPathDetail(resolvedSlug, childId, userId)
  const articles = detail?.articles ?? []
  const articleIds = articles.map((a) => a.article_id)

  let quizScores: Record<string, number> = {}
  let starsEarned = 0
  if (childId) {
    quizScores = await fetchQuizScores(childId, articleIds)
    const completed = articles.filter((a) => a.complete).length
    starsEarned = completed * 15
  }

  if (!detail) {
    return {
      marketing,
      adventurePath,
      articles: [],
      pathProgress: null,
      accessible: adventurePath.is_free,
      adventureSlug: adventurePath.slug,
      publicSlug,
      quizScores: {},
      starsEarned: 0,
    }
  }

  return {
    marketing,
    adventurePath: detail.path,
    articles: detail.articles,
    pathProgress: detail.pathProgress,
    accessible: detail.accessible,
    adventureSlug: detail.path.slug,
    publicSlug,
    quizScores,
    starsEarned,
  }
}

export function mergeMarketingWithPath(
  marketing: LearningPathDefinition,
  path: AdventurePath | null,
): {
  title: string
  description: string
  mission: string
  coverImageUrl: string
  icon: string
  color: string
  certificateEnabled: boolean
  certificateTitle: string
} {
  const extended = path as ExtendedPath | null
  return {
    title: path?.title ?? marketing.name,
    description: path?.description ?? marketing.description,
    mission: extended?.mission_statement ?? marketing.mission,
    coverImageUrl: path?.cover_image_url ?? marketing.coverImageUrl,
    icon: extended?.icon ?? marketing.icon,
    color: marketing.color,
    certificateEnabled: Boolean(extended?.certificate_enabled),
    certificateTitle: extended?.certificate_title ?? `${marketing.name} Certificate`,
  }
}
