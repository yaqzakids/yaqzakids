import type { PathWithProgress } from '@/lib/adventure/types'
import { resolvePublicPathSlug } from '@/lib/learningPaths'
import type { AgeGroup } from '@/lib/types'

export interface LearningPathSectionItem {
  slug: string
  title: string
  description: string
  buttonColor: string
  defaultCoverUrl: string
}

export const LEARNING_PATHS_SECTION: LearningPathSectionItem[] = [
  {
    slug: 'foundations-of-faith',
    title: 'Foundations of Faith',
    description: 'Build a strong connection with Allah and learn Islamic values.',
    buttonColor: '#8B6BB1',
    defaultCoverUrl: '/paths/covers/foundations-of-faith.png',
  },
  {
    slug: 'science-nature',
    title: 'Science & Nature',
    description: "Explore the wonders of Allah's creation through science.",
    buttonColor: '#16a34a',
    defaultCoverUrl: '/paths/covers/science-nature.png',
  },
  {
    slug: 'history-civilization',
    title: 'History & Civilization',
    description: 'Discover the stories of nations and great civilizations.',
    buttonColor: '#F5A623',
    defaultCoverUrl: '/paths/covers/history-civilization.png',
  },
  {
    slug: 'geography-cultures',
    title: 'Geography & Cultures',
    description: 'Learn about countries, cultures and people around the world.',
    buttonColor: '#2563eb',
    defaultCoverUrl: '/paths/covers/geography-cultures.png',
  },
  {
    slug: 'technology-ai',
    title: 'Technology & AI',
    description: "Understand technology and use it for good in today's world.",
    buttonColor: '#8B6BB1',
    defaultCoverUrl: '/paths/covers/technology-ai.png',
  },
  {
    slug: 'todays-world',
    title: "Today's World",
    description: 'Understand current events and how the world works.',
    buttonColor: '#E85D4A',
    defaultCoverUrl: '/paths/covers/todays-world.png',
  },
  {
    slug: 'environment-stewardship',
    title: 'Environment & Stewardship',
    description: 'Take care of the Earth and learn to be a responsible steward.',
    buttonColor: '#16a34a',
    defaultCoverUrl: '/paths/covers/environment-stewardship.png',
  },
]

export function matchSectionPathProgress(
  pathSlug: string,
  allPaths: PathWithProgress[]
): PathWithProgress | undefined {
  return allPaths.find((p) => {
    const publicSlug = resolvePublicPathSlug(p.slug)
    return publicSlug === pathSlug || p.slug === pathSlug
  })
}

export function sectionPathCoverUrl(
  item: LearningPathSectionItem,
  _livePath?: PathWithProgress
): string {
  return item.defaultCoverUrl
}

export function sectionPathHasProgress(livePath?: PathWithProgress): boolean {
  if (!livePath) return false
  const completed = livePath.path_progress?.completed_articles ?? 0
  const pct = livePath.path_progress?.completion_percentage ?? 0
  return completed > 0 || pct > 0
}

const SIGNED_IN_SUBTITLES: Record<AgeGroup, string> = {
  explorer: 'Choose a path and start your adventure',
  discoverer: 'Choose a path and continue your adventure',
  thinker: 'Choose a path and continue your adventure',
}

const SIGNED_OUT_SUBTITLES: Record<AgeGroup, string> = {
  explorer: 'Choose a path and start your adventure',
  discoverer: 'Choose a path and start your adventure',
  thinker: 'Choose a path and start your adventure',
}

export function learningPathsSubtitleForAge(
  ageGroup: AgeGroup,
  isSignedIn: boolean
): string {
  return isSignedIn ? SIGNED_IN_SUBTITLES[ageGroup] : SIGNED_OUT_SUBTITLES[ageGroup]
}
