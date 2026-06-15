import { QUIZ_PASSING_SCORE } from '@/lib/adventure/constants'
import type { ArticleProgress, PathArticle, PathArticleWithProgress } from '@/lib/adventure/types'

export type ArticleUnlockStatus = 'completed' | 'available' | 'locked'
export type ArticleLockReason = 'premium' | 'sequential'

export const SEQUENTIAL_LOCK_MESSAGE =
  'Complete the previous lesson and pass the quiz to continue.'

export const SEQUENTIAL_LOCK_TOAST =
  'Complete the previous lesson and pass the quiz to unlock this story.'

export function isArticleComplete(progress: ArticleProgress | null | undefined): boolean {
  return Boolean(progress?.read_completed && progress?.quiz_passed)
}

export function sortPathArticles<T extends Pick<PathArticle, 'sort_order'>>(articles: T[]): T[] {
  return [...articles].sort((a, b) => a.sort_order - b.sort_order)
}

export function getPreviousPathArticle(
  pathArticles: PathArticle[],
  articleId: string,
): PathArticle | null {
  const sorted = sortPathArticles(pathArticles)
  const index = sorted.findIndex((item) => item.article_id === articleId)
  if (index <= 0) return null
  return sorted[index - 1] ?? null
}

export function canAccessArticleInPath({
  pathArticles,
  articleId,
  articleProgress,
  pathAccessible,
}: {
  pathArticles: PathArticle[]
  articleId: string
  articleProgress: Record<string, ArticleProgress>
  pathAccessible: boolean
}): {
  accessible: boolean
  unlockStatus: ArticleUnlockStatus
  lockReason: ArticleLockReason | null
  previousArticle: PathArticle | null
} {
  const sorted = sortPathArticles(pathArticles)
  const index = sorted.findIndex((item) => item.article_id === articleId)

  if (index === -1) {
    return {
      accessible: false,
      unlockStatus: 'locked',
      lockReason: 'sequential',
      previousArticle: null,
    }
  }

  if (!pathAccessible) {
    return {
      accessible: false,
      unlockStatus: 'locked',
      lockReason: 'premium',
      previousArticle: index > 0 ? sorted[index - 1] : null,
    }
  }

  const progress = articleProgress[articleId]
  if (isArticleComplete(progress)) {
    return {
      accessible: true,
      unlockStatus: 'completed',
      lockReason: null,
      previousArticle: index > 0 ? sorted[index - 1] : null,
    }
  }

  if (index === 0) {
    return {
      accessible: true,
      unlockStatus: 'available',
      lockReason: null,
      previousArticle: null,
    }
  }

  const previousArticle = sorted[index - 1]
  const previousComplete = isArticleComplete(articleProgress[previousArticle.article_id])

  if (previousComplete) {
    return {
      accessible: true,
      unlockStatus: 'available',
      lockReason: null,
      previousArticle,
    }
  }

  return {
    accessible: false,
    unlockStatus: 'locked',
    lockReason: 'sequential',
    previousArticle,
  }
}

export function applyPathArticleProgression(
  pathArticles: PathArticle[],
  articleProgress: Record<string, ArticleProgress>,
  pathAccessible: boolean,
): PathArticleWithProgress[] {
  return sortPathArticles(pathArticles).map((pathArticle) => {
    const access = canAccessArticleInPath({
      pathArticles,
      articleId: pathArticle.article_id,
      articleProgress,
      pathAccessible,
    })

    return {
      ...pathArticle,
      progress: articleProgress[pathArticle.article_id] ?? null,
      locked: !access.accessible,
      complete: access.unlockStatus === 'completed',
      unlockStatus: access.unlockStatus,
      lockReason: access.lockReason,
      previousArticle: access.previousArticle,
    }
  })
}

export function findNextAvailablePathArticle(
  pathArticles: PathArticleWithProgress[],
): PathArticleWithProgress | null {
  return pathArticles.find((item) => item.unlockStatus === 'available') ?? null
}

export function articleStatusLabel(unlockStatus: ArticleUnlockStatus | undefined): string {
  if (unlockStatus === 'completed') return '✅ Completed'
  if (unlockStatus === 'available') return '🔓 Available'
  return '🔒 Locked'
}

export { QUIZ_PASSING_SCORE }
