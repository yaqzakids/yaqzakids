import { fetchPathsWithProgress, fetchChildBadges } from '@/lib/adventure/service'
import { fetchChildDashboardAnalytics } from '@/lib/adventure/engagement'
import { fetchChildCertificates } from '@/lib/discoverer'
import { supabase } from '@/lib/supabase'
import type { PathWithProgress, Pillar } from '@/lib/adventure/types'
import type {
  CertificateProgress,
  ChildJourneyData,
  JourneyStats,
  PillarCategoryProgress,
  RecentAchievement,
} from '@/lib/journey/types'

function buildPillarProgress(pillars: Pillar[], paths: PathWithProgress[]): PillarCategoryProgress[] {
  return pillars.map((pillar) => {
    const pillarPaths = paths.filter((p) => p.pillar_id === pillar.id)

    let completedLessons = 0
    let totalLessons = 0
    for (const path of pillarPaths) {
      totalLessons += path.lessonCount ?? path.path_progress?.total_articles ?? 0
      completedLessons += path.path_progress?.completed_articles ?? 0
    }

    const progressPercent =
      totalLessons > 0 ? Math.min(100, Math.round((completedLessons / totalLessons) * 100)) : 0
    const hasProgress = completedLessons > 0

    const activePath =
      pillarPaths
        .filter((p) => (p.path_progress?.completion_percentage ?? 0) < 100)
        .sort(
          (a, b) =>
            (b.path_progress?.completion_percentage ?? 0) -
            (a.path_progress?.completion_percentage ?? 0)
        )[0] ?? pillarPaths[0]

    const status: PillarCategoryProgress['status'] =
      progressPercent >= 100 ? 'complete' : hasProgress ? 'continue' : 'start'

    return {
      pillarId: pillar.id,
      title: pillar.name,
      icon: pillar.icon,
      color: pillar.color,
      completedLessons,
      totalLessons,
      progressPercent,
      status,
      pathSlug: activePath?.slug ?? null,
      hasProgress,
    }
  })
}

async function fetchRecentAchievements(childId: string): Promise<RecentAchievement[]> {
  const [badgesRes, ledgerRes] = await Promise.all([
    fetchChildBadges(childId),
    supabase
      .from('points_ledger')
      .select('points, source_id')
      .eq('child_profile_id', childId)
      .eq('source_type', 'badge'),
  ])

  if (ledgerRes.error) {
    console.warn('Could not load badge star ledger:', ledgerRes.error.message)
  }

  const starsByBadgeId = new Map<string, number>()
  for (const row of ledgerRes.data ?? []) {
    if (row.source_id) starsByBadgeId.set(row.source_id, row.points)
  }

  return [...badgesRes]
    .sort((a, b) => new Date(b.awarded_at).getTime() - new Date(a.awarded_at).getTime())
    .slice(0, 3)
    .map((row) => ({
      id: row.id,
      icon: row.badge?.icon ?? '🏅',
      title: row.badge?.name ?? 'Achievement',
      reason: row.badge?.description ?? 'Great work on your learning journey!',
      starsEarned: starsByBadgeId.get(row.badge_id) ?? null,
      awardedAt: row.awarded_at,
    }))
}

function buildCertificateProgress(
  paths: PathWithProgress[],
  certificates: Awaited<ReturnType<typeof fetchChildCertificates>>
): CertificateProgress {
  if (certificates.length > 0) {
    const latest = certificates[0]
    return {
      kind: 'earned',
      pathName: latest.path_name,
      certificateId: latest.id,
    }
  }

  const inProgress = paths
    .filter((p) => {
      const pct = p.path_progress?.completion_percentage ?? 0
      return pct > 0 && !p.path_progress?.completed
    })
    .sort(
      (a, b) =>
        (b.path_progress?.completion_percentage ?? 0) -
        (a.path_progress?.completion_percentage ?? 0)
    )[0]

  if (inProgress) {
    return {
      kind: 'in_progress',
      pathName: inProgress.title,
      pathSlug: inProgress.slug,
      progressPercent: inProgress.path_progress?.completion_percentage ?? 0,
    }
  }

  return { kind: 'empty' }
}

function buildJourneyStats(
  analytics: Awaited<ReturnType<typeof fetchChildDashboardAnalytics>>
): JourneyStats {
  const { hasActivity, totalStars, currentStreak, articlesCompleted, badgesEarned } = analytics

  if (!hasActivity) {
    return {
      hasActivity: false,
      stars: null,
      streak: null,
      lessonsCompleted: null,
      badgesEarned: null,
    }
  }

  return {
    hasActivity: true,
    stars: totalStars,
    streak: currentStreak,
    lessonsCompleted: articlesCompleted,
    badgesEarned,
  }
}

export async function fetchChildJourneyData(
  childProfileId: string,
  userId: string | null
): Promise<ChildJourneyData> {
  const [{ pillars, paths }, analytics, certificates] = await Promise.all([
    fetchPathsWithProgress(childProfileId, userId),
    fetchChildDashboardAnalytics(childProfileId),
    fetchChildCertificates(childProfileId),
  ])

  const recentAchievements = await fetchRecentAchievements(childProfileId)

  return {
    journeyStats: buildJourneyStats(analytics),
    categoryProgress: buildPillarProgress(pillars, paths),
    recentAchievements,
    certificateProgress: buildCertificateProgress(paths, certificates),
  }
}
