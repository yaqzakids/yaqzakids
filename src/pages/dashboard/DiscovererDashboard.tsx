import DiscovererPageShell from '@/components/discoverer/DiscovererPageShell'
import SignedInDiscovererDashboard from '@/components/discoverer/home/SignedInDiscovererDashboard'
import LoadingSpinner from '@/components/LoadingSpinner'
import { useAuth } from '@/components/ProtectedRoute'
import { useSelectedChild } from '@/context/SelectedChildContext'
import { useSignedInChildHomeData } from '@/hooks/useSignedInChildHomeData'

/** Full progress/profile dashboard at /discoverer/dashboard */
export default function DiscovererDashboard() {
  const { user } = useAuth()
  const { selectedChild, loading: childLoading } = useSelectedChild()
  const {
    loading,
    homeData,
    missionDone,
    lastArticle,
    levelNumber,
    levelName,
    stars,
    streak,
    activePath,
    pathLabel,
  } = useSignedInChildHomeData(selectedChild?.id ?? null, user?.id ?? null, selectedChild?.name ?? '')

  if (childLoading || loading) {
    return (
      <DiscovererPageShell backFallback="/discoverer" homeTo="/discoverer">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-24 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </DiscovererPageShell>
    )
  }

  if (!selectedChild || !homeData) {
    return null
  }

  const earnedBadgeSlugs = new Set(homeData.badges.filter((b) => b.earned).map((b) => b.slug))

  return (
    <DiscovererPageShell backFallback="/discoverer" homeTo="/discoverer">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <SignedInDiscovererDashboard
          childName={selectedChild.name}
          levelNumber={levelNumber}
          levelName={levelName}
          xp={stars}
          stars={stars}
          streak={streak}
          missionDone={missionDone}
          lastArticle={lastArticle}
          activePath={activePath}
          pathLabel={pathLabel}
          allPaths={homeData.allPaths}
          recommendedArticles={homeData.recommendedArticles}
          earnedBadgeSlugs={earnedBadgeSlugs}
        />
      </div>
    </DiscovererPageShell>
  )
}
