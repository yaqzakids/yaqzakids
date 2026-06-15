import { useEffect, useMemo, useState } from 'react'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { useAuth } from '@/components/ProtectedRoute'
import { useSelectedChild } from '@/context/SelectedChildContext'
import LoadingSpinner from '@/components/LoadingSpinner'
import BadgeDetailModal from '@/components/discoverer/BadgeDetailModal'
import SignedOutDiscovererHero from '@/components/discoverer/SignedOutDiscovererHero'
import SignedInDiscovererDashboard from '@/components/discoverer/home/SignedInDiscovererDashboard'
import LearningPathsGrid from '@/components/discoverer/home/LearningPathsGrid'
import RootedInFaithSection from '@/components/discoverer/home/RootedInFaithSection'
import SignedOutFeaturedSection from '@/components/discoverer/home/SignedOutFeaturedSection'
import {
  ForParentsSection,
  PricingTeaserSection,
} from '@/components/discoverer/home/SignedOutSections'
import {
  fetchDiscovererHomepageData,
  fetchDailyMission,
  fetchLastUnfinishedArticle,
  matchPathForCategory,
  LEARNING_PATHS_HOME,
  type DiscovererBadgeDisplay,
  type DiscovererHomepageData,
  type LastUnfinishedArticle,
} from '@/lib/discoverer'
import { getLevelProgress, STAR_LEVELS } from '@/lib/adventure/levels'
import type { PathWithProgress } from '@/lib/adventure/types'

function levelNumber(totalStars: number): number {
  let idx = 0
  for (let i = 0; i < STAR_LEVELS.length; i++) {
    if (totalStars >= STAR_LEVELS[i].min) idx = i
  }
  return idx + 1
}

function findActivePath(
  lastArticle: LastUnfinishedArticle | null,
  continuePaths: PathWithProgress[],
  allPaths: PathWithProgress[]
): { path: PathWithProgress | null; pathLabel: string | null } {
  if (lastArticle?.url) {
    const slugMatch = lastArticle.url.match(/\/adventures\/([^/]+)/)
    if (slugMatch) {
      const path = allPaths.find((p) => p.slug === slugMatch[1])
      if (path) {
        const category = LEARNING_PATHS_HOME.find((c) => matchPathForCategory(c, [path]))
        return { path, pathLabel: category?.name ?? path.title }
      }
    }
  }
  const path = continuePaths[0] ?? null
  if (!path) return { path: null, pathLabel: null }
  const category = LEARNING_PATHS_HOME.find((c) => matchPathForCategory(c, [path]))
  return { path, pathLabel: category?.name ?? path.title }
}

export default function Discoverer() {
  const { user } = useAuth()
  const { selectedChild, loading: childLoading } = useSelectedChild()
  const [data, setData] = useState<DiscovererHomepageData | null>(null)
  const [missionDone, setMissionDone] = useState({ read: false, quiz: false, reflection: false })
  const [lastArticle, setLastArticle] = useState<LastUnfinishedArticle | null>(null)
  const [selectedBadge, setSelectedBadge] = useState<DiscovererBadgeDisplay | null>(null)
  const [loading, setLoading] = useState(true)

  const isSignedIn = Boolean(user && selectedChild)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    if (!selectedChild) {
      fetchDiscovererHomepageData(null, user?.id ?? null)
        .then((home) => {
          if (cancelled) return
          setData(home)
          setMissionDone({ read: false, quiz: false, reflection: false })
          setLastArticle(null)
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
      return () => {
        cancelled = true
      }
    }

    Promise.all([
      fetchDiscovererHomepageData(selectedChild.id, user?.id ?? null, selectedChild.name),
      fetchDailyMission(selectedChild.id),
      fetchLastUnfinishedArticle(selectedChild.id),
    ])
      .then(([home, mission, last]) => {
        if (cancelled) return
        setData(home)
        setLastArticle(last)
        if (mission) {
          setMissionDone({
            read: mission.readStory,
            quiz: mission.passQuiz,
            reflection: mission.answerReflection,
          })
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedChild?.id, user?.id, selectedChild?.name])

  const stats = data?.stats
  const stars = stats?.stars ?? 0
  const streak = stats?.streak ?? 0
  const levelInfo = getLevelProgress(stars)
  const lvl = levelNumber(stars)
  const earnedBadgeSlugs = new Set(
    (data?.badges ?? []).filter((b) => b.earned).map((b) => b.slug)
  )
  const allPaths = data?.allPaths ?? []
  const continuePaths = data?.continuePaths ?? []

  const { path: activePath, pathLabel } = useMemo(
    () => findActivePath(lastArticle, continuePaths, allPaths),
    [lastArticle, continuePaths, allPaths]
  )

  return (
    <div className="min-h-screen bg-[#EEF4FF] page-transition flex flex-col">
      <SiteNav variant="discoverer" />
      <BadgeDetailModal
        badge={selectedBadge}
        earned={selectedBadge ? earnedBadgeSlugs.has(selectedBadge.slug) : false}
        onClose={() => setSelectedBadge(null)}
      />

      {!isSignedIn && !childLoading && (
        <>
          <SignedOutDiscovererHero />
          <RootedInFaithSection />
          <SignedOutFeaturedSection />
          <div className="max-w-[1280px] mx-auto px-5 md:px-8 bg-[#EEF4FF]">
            <LearningPathsGrid isSignedIn={false} allPaths={allPaths} />
          </div>
        </>
      )}

      <div className="max-w-[1280px] mx-auto px-5 md:px-8 pb-16">
        {loading && isSignedIn && (
          <div className="pt-6 pb-4 flex justify-center">
            <LoadingSpinner />
          </div>
        )}

        {!loading && isSignedIn && (
          <SignedInDiscovererDashboard
            childName={selectedChild!.name}
            levelNumber={lvl}
            levelName={levelInfo.currentLevel}
            xp={stars}
            stars={stars}
            streak={streak}
            missionDone={missionDone}
            lastArticle={lastArticle}
            activePath={activePath}
            pathLabel={pathLabel}
            allPaths={allPaths}
            recommendedArticles={data?.recommendedArticles ?? []}
            earnedBadgeSlugs={earnedBadgeSlugs}
            onBadgeClick={setSelectedBadge}
          />
        )}

        {!loading && !isSignedIn && (
          <div className="pt-4">
            <ForParentsSection />
            <PricingTeaserSection />
          </div>
        )}
      </div>

      <SiteFooter variant="light" />
    </div>
  )
}
