import type { PathWithProgress } from '@/lib/adventure/types'
import type { LastUnfinishedArticle } from '@/lib/discoverer'

export function findActivePath(
  lastArticle: LastUnfinishedArticle | null,
  continuePaths: PathWithProgress[],
  allPaths: PathWithProgress[]
): { path: PathWithProgress | null; pathLabel: string | null } {
  if (lastArticle?.url) {
    const slugMatch = lastArticle.url.match(/\/adventures\/([^/]+)/)
    if (slugMatch) {
      const path = allPaths.find((p) => p.slug === slugMatch[1])
      if (path) return { path, pathLabel: path.title }
    }
  }

  const path = continuePaths[0] ?? null
  return { path, pathLabel: path?.title ?? null }
}
