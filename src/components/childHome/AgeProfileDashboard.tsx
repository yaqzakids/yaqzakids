import { Link } from 'react-router-dom'
import UserAvatar from '@/components/UserAvatar'
import LoadingSpinner from '@/components/LoadingSpinner'
import MyJourneySection from '@/components/journey/MyJourneySection'
import ContinueLearningSection from '@/components/discoverer/home/ContinueLearningSection'
import LearningPathsSection from '@/components/learningPaths/LearningPathsSection'
import { useSignedInChildHomeData } from '@/hooks/useSignedInChildHomeData'
import DailyDuaCard from '@/components/parent/DailyDuaCard'
import IslamicWorldviewGrowthSection from '@/components/dashboard/IslamicWorldviewGrowthSection'
import { AGE_GROUP_META, childHomePathForAgeGroup } from '@/lib/childProfiles'
import type { AgeGroup, ChildProfile } from '@/lib/types'

export interface AgeProfileDashboardProps {
  ageGroup: AgeGroup
  selectedChild: ChildProfile
  userId: string | null
}

/** Full progress/profile dashboard for Explorer and Thinker age paths. */
export default function AgeProfileDashboard({ ageGroup, selectedChild, userId }: AgeProfileDashboardProps) {
  const {
    loading,
    homeData,
    journeyData,
    lastArticle,
    activePath,
    pathLabel,
  } = useSignedInChildHomeData(selectedChild.id, userId, selectedChild.name)

  const meta = AGE_GROUP_META[ageGroup]
  const homePath = childHomePathForAgeGroup(ageGroup)

  if (loading || !homeData || !journeyData) {
    return (
      <div className="py-24 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const badgesRoute = ageGroup === 'discoverer' ? '/discoverer/badges' : '/adventures'
  const certificatesRoute = ageGroup === 'discoverer' ? '/discoverer/certificates' : '/adventures'

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 py-10">
      <div className="flex items-center gap-4 mb-8">
        <UserAvatar name={selectedChild.name} avatarId={selectedChild.avatar_id ?? null} size={56} />
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-[#1B2F5E]">
            Welcome back, {selectedChild.name}! 👋
          </h1>
          <p className="text-sm text-[#6B7280] font-semibold mt-1">
            {meta.label} · Ages {meta.ages}
          </p>
        </div>
      </div>

      <LearningPathsSection isSignedIn ageGroup={ageGroup} allPaths={homeData.allPaths} />

      <MyJourneySection
        ageGroup={ageGroup}
        childProfileId={selectedChild.id}
        journeyStats={journeyData.journeyStats}
        categoryProgress={journeyData.categoryProgress}
        recentAchievements={journeyData.recentAchievements}
        certificateProgress={journeyData.certificateProgress}
        badgesRoute={badgesRoute}
        certificatesRoute={certificatesRoute}
      />

      <ContinueLearningSection
        lastArticle={lastArticle}
        activePath={activePath}
        pathLabel={pathLabel}
      />

      <IslamicWorldviewGrowthSection className="mt-10" titleClassName="font-display text-xl font-bold text-[#1B2F5E] mb-4" />

      <div className="mt-10">
        <DailyDuaCard />
      </div>

      <div className="mt-10 text-center">
        <Link
          to={homePath}
          className="inline-flex px-6 py-3 bg-[#2AAFA0] text-white rounded-full font-extrabold hover:opacity-90"
        >
          ← Back to home
        </Link>
      </div>
    </div>
  )
}
