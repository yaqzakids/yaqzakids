import { supabase } from '@/lib/supabase'
import { fetchPathDetail } from '@/lib/adventure/service'
import type { AdventurePath, PathArticleWithProgress, PathProgress } from '@/lib/adventure/types'
import {
  getLearningPathBySlug,
  type LearningPathDefinition,
} from '@/lib/learningPaths'

export interface LearningPathPageData {
  marketing: LearningPathDefinition
  adventurePath: AdventurePath | null
  articles: PathArticleWithProgress[]
  pathProgress: PathProgress | null
  accessible: boolean
  adventureSlug: string | null
}

async function fetchAdventurePathForPublicSlug(
  publicSlug: string,
  adventureSlug: string,
): Promise<AdventurePath | null> {
  const { data: byPublic, error: publicError } = await supabase
    .from('adventure_paths')
    .select('*, pillar:pillars(*), badge:badges(*)')
    .eq('public_slug', publicSlug)
    .maybeSingle()

  if (!publicError && byPublic) return byPublic as AdventurePath

  if (publicError && !publicError.message.includes('public_slug')) {
    // Column missing or other error — fall back to adventure slug
  }

  return fetchAdventurePathBySlug(adventureSlug)
}

async function fetchAdventurePathBySlug(adventureSlug: string): Promise<AdventurePath | null> {
  const { data: bySlug, error } = await supabase
    .from('adventure_paths')
    .select('*, pillar:pillars(*), badge:badges(*)')
    .eq('slug', adventureSlug)
    .maybeSingle()

  if (error || !bySlug) return null
  return bySlug as AdventurePath
}

export async function fetchLearningPathPageData(
  publicSlug: string,
  childId: string | null,
  userId: string | null,
): Promise<LearningPathPageData | null> {
  const marketing = getLearningPathBySlug(publicSlug)
  if (!marketing) return null

  const adventurePath = await fetchAdventurePathForPublicSlug(publicSlug, marketing.adventureSlug)

  const resolvedSlug = adventurePath?.slug ?? marketing.adventureSlug

  if (!adventurePath) {
    return {
      marketing,
      adventurePath: null,
      articles: [],
      pathProgress: null,
      accessible: true,
      adventureSlug: null,
    }
  }

  const detail = await fetchPathDetail(resolvedSlug, childId, userId)
  if (!detail) {
    return {
      marketing,
      adventurePath,
      articles: [],
      pathProgress: null,
      accessible: adventurePath.is_free,
      adventureSlug: adventurePath.slug,
    }
  }

  return {
    marketing,
    adventurePath: detail.path,
    articles: detail.articles,
    pathProgress: detail.pathProgress,
    accessible: detail.accessible,
    adventureSlug: detail.path.slug,
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
} {
  const extended = path as (AdventurePath & { mission_statement?: string | null; icon?: string | null }) | null
  return {
    title: path?.title ?? marketing.name,
    description: path?.description ?? marketing.description,
    mission: extended?.mission_statement ?? marketing.mission,
    coverImageUrl: path?.cover_image_url ?? marketing.coverImageUrl,
    icon: extended?.icon ?? marketing.icon,
  }
}
