import SignedInDiscovererHero from '@/components/discoverer/SignedInDiscovererHero'
import PersonalizedHero from '@/components/discoverer/home/PersonalizedHero'
import CompactMyJourneySection from '@/components/journey/CompactMyJourneySection'
import LearningPathsGrid from '@/components/discoverer/home/LearningPathsGrid'
import ContinueLearningSection from '@/components/discoverer/home/ContinueLearningSection'
import DiscoverNewTodaySection from '@/components/discoverer/home/DiscoverNewTodaySection'
import FeaturedStorySection from '@/components/discoverer/home/FeaturedStorySection'
import LoadingSpinner from '@/components/LoadingSpinner'
import { useSignedInChildHomeData } from '@/hooks/useSignedInChildHomeData'
import { AGE_GROUP_META } from '@/lib/childProfiles'
import { SIGNED_IN_FEATURED_STORY, SIGNED_IN_RECOMMENDED } from '@/lib/discovererHomeContent'
import type { AgeGroup, ChildProfile } from '@/lib/types'

export interface SignedInChildHomeProps {
  ageGroup: AgeGroup
  selectedChild: ChildProfile
  userId: string | null
}

/** Path main page content — compact hero + compact journey, not the full dashboard. */
export default function SignedInChildHome({ ageGroup, selectedChild, userId }: SignedInChildHomeProps) {
  const {
    loading,
    homeData,
    journeyData,
    missionDone,
    lastArticle,
    levelNumber,
    levelName,
    stars,
    streak,
    activePath,
    pathLabel,
  } = useSignedInChildHomeData(selectedChild.id, userId, selectedChild.name)

  if (loading || !homeData || !journeyData) {
    return (
      <div className="pt-6 pb-4 flex justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  const ageMeta = AGE_GROUP_META[ageGroup]

  const lastArticlePreview =
    lastArticle != null
      ? {
          title: lastArticle.title,
          url: lastArticle.url,
          statusLabel: pathLabel ?? 'Continue',
        }
      : null

  return (
    <div className="pt-2 pb-4">
      {ageGroup === 'discoverer' ? (
        <SignedInDiscovererHero
          childName={selectedChild.name}
          avatarId={selectedChild.avatar_id ?? null}
          levelNumber={levelNumber}
          levelName={levelName}
          missionDone={missionDone}
          lastArticle={lastArticlePreview}
        />
      ) : (
        <PersonalizedHero
          ageGroup={ageGroup}
          childName={selectedChild.name}
          avatarId={selectedChild.avatar_id ?? null}
          levelNumber={levelNumber}
          levelName={levelName}
          xp={stars}
          stars={stars}
          streak={streak}
          missionDone={missionDone}
          lastArticle={lastArticle}
          continuePathLabel={pathLabel}
        />
      )}

      <CompactMyJourneySection
        ageGroup={ageGroup}
        categoryProgress={journeyData.categoryProgress}
        recentAchievements={journeyData.recentAchievements}
        certificateProgress={journeyData.certificateProgress}
      />

      <LearningPathsGrid isSignedIn allPaths={homeData.allPaths} />

      <ContinueLearningSection
        lastArticle={lastArticle}
        activePath={activePath}
        pathLabel={pathLabel}
      />

      <DiscoverNewTodaySection
        articles={homeData.recommendedArticles}
        fallbackCards={SIGNED_IN_RECOMMENDED}
        exploreRoute="/discoverer/explore"
      />

      <FeaturedStorySection story={SIGNED_IN_FEATURED_STORY} signedIn ageLabel={ageMeta.ages} />
    </div>
  )
}
