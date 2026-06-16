import { useEffect, useMemo, useState } from 'react'
import { getLevelProgress, STAR_LEVELS } from '@/lib/adventure/levels'
import {
  fetchDailyMission,
  fetchDiscovererHomepageData,
  fetchLastUnfinishedArticle,
  type DiscovererHomepageData,
  type LastUnfinishedArticle,
} from '@/lib/discoverer'
import { fetchChildJourneyData } from '@/lib/journey/fetchJourneyData'
import type { ChildJourneyData } from '@/lib/journey/types'
import { findActivePath } from '@/lib/childHome/findActivePath'
import type { PathWithProgress } from '@/lib/adventure/types'

function levelNumber(totalStars: number): number {
  let idx = 0
  for (let i = 0; i < STAR_LEVELS.length; i++) {
    if (totalStars >= STAR_LEVELS[i].min) idx = i
  }
  return idx + 1
}

const EMPTY_JOURNEY: ChildJourneyData = {
  journeyStats: {
    hasActivity: false,
    stars: null,
    streak: null,
    lessonsCompleted: null,
    badgesEarned: null,
  },
  categoryProgress: [],
  recentAchievements: [],
  certificateProgress: { kind: 'empty' },
}

function emptyHomeData(childName: string): DiscovererHomepageData {
  return {
    stats: {
      stars: 0,
      xp: 0,
      level: 'Seeker',
      levelProgress: 0,
      starsToNext: 100,
      streak: 0,
      articlesRead: 0,
      quizzesCompleted: 0,
      badgesCount: 0,
    },
    childName,
    featuredArticle: null,
    allPaths: [],
    continuePaths: [],
    recommendedArticles: [],
    badges: [],
  }
}

export interface SignedInChildHomeData {
  loading: boolean
  homeData: DiscovererHomepageData | null
  journeyData: ChildJourneyData | null
  missionDone: { read: boolean; quiz: boolean; reflection: boolean }
  lastArticle: LastUnfinishedArticle | null
  levelNumber: number
  levelName: string
  stars: number
  streak: number
  activePath: PathWithProgress | null
  pathLabel: string | null
}

export function useSignedInChildHomeData(
  childProfileId: string | null,
  userId: string | null,
  childName: string
): SignedInChildHomeData {
  const [loading, setLoading] = useState(true)
  const [homeData, setHomeData] = useState<DiscovererHomepageData | null>(null)
  const [journeyData, setJourneyData] = useState<ChildJourneyData | null>(null)
  const [missionDone, setMissionDone] = useState({ read: false, quiz: false, reflection: false })
  const [lastArticle, setLastArticle] = useState<LastUnfinishedArticle | null>(null)

  useEffect(() => {
    if (!childProfileId) {
      setHomeData(null)
      setJourneyData(null)
      setMissionDone({ read: false, quiz: false, reflection: false })
      setLastArticle(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    Promise.all([
      fetchDiscovererHomepageData(childProfileId, userId, childName),
      fetchChildJourneyData(childProfileId, userId),
      fetchDailyMission(childProfileId),
      fetchLastUnfinishedArticle(childProfileId),
    ])
      .then(([home, journey, mission, last]) => {
        if (cancelled) return
        setHomeData(home)
        setJourneyData(journey)
        setLastArticle(last)
        if (mission) {
          setMissionDone({
            read: mission.readStory,
            quiz: mission.passQuiz,
            reflection: mission.answerReflection,
          })
        } else {
          setMissionDone({ read: false, quiz: false, reflection: false })
        }
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Failed to load signed-in child home data:', err)
        setHomeData(emptyHomeData(childName))
        setJourneyData(EMPTY_JOURNEY)
        setLastArticle(null)
        setMissionDone({ read: false, quiz: false, reflection: false })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [childProfileId, userId, childName])

  const stars = homeData?.stats.stars ?? 0
  const streak = homeData?.stats.streak ?? 0
  const levelInfo = getLevelProgress(stars)
  const lvl = levelNumber(stars)

  const { path: activePath, pathLabel } = useMemo(
    () =>
      findActivePath(lastArticle, homeData?.continuePaths ?? [], homeData?.allPaths ?? []),
    [lastArticle, homeData?.continuePaths, homeData?.allPaths]
  )

  return {
    loading,
    homeData,
    journeyData,
    missionDone,
    lastArticle,
    levelNumber: lvl,
    levelName: levelInfo.currentLevel,
    stars,
    streak,
    activePath,
    pathLabel,
  }
}
