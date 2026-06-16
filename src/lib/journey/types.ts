import type { AgeGroup } from '@/lib/types'

export interface JourneyStats {
  hasActivity: boolean
  stars: number | null
  streak: number | null
  lessonsCompleted: number | null
  badgesEarned: number | null
}

export interface PillarCategoryProgress {
  pillarId: string
  title: string
  icon: string | null
  color: string
  completedLessons: number
  totalLessons: number
  progressPercent: number
  status: 'start' | 'continue' | 'complete'
  pathSlug: string | null
  hasProgress: boolean
}

export interface RecentAchievement {
  id: string
  icon: string
  title: string
  reason: string
  starsEarned: number | null
  awardedAt: string
}

export type CertificateProgress =
  | {
      kind: 'earned'
      pathName: string
      certificateId: string
    }
  | {
      kind: 'in_progress'
      pathName: string
      pathSlug: string
      progressPercent: number
    }
  | {
      kind: 'empty'
    }

export interface ChildJourneyData {
  journeyStats: JourneyStats
  categoryProgress: PillarCategoryProgress[]
  recentAchievements: RecentAchievement[]
  certificateProgress: CertificateProgress
}

export const JOURNEY_SECTION_TITLES: Record<AgeGroup, string> = {
  explorer: '🌟 My Adventure Map',
  discoverer: '🧭 My Journey',
  thinker: '📍 My Learning Journey',
}
