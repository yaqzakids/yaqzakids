import LearningPathsSection from '@/components/learningPaths/LearningPathsSection'
import { learningPathsSubtitleForAge } from '@/lib/learningPathsSectionConfig'
import type { PathWithProgress } from '@/lib/adventure/types'
import type { AgeGroup } from '@/lib/types'

/** @deprecated Use LearningPathsSection — kept for existing imports */
export default function LearningPathsGrid({
  isSignedIn,
  allPaths,
  variant: _variant = 'grid',
  ageGroup = 'discoverer',
}: {
  isSignedIn: boolean
  allPaths: PathWithProgress[]
  variant?: 'grid' | 'scenic'
  ageGroup?: AgeGroup
}) {
  return (
    <LearningPathsSection
      isSignedIn={isSignedIn}
      allPaths={allPaths}
      ageGroup={ageGroup}
      subtitle={learningPathsSubtitleForAge(ageGroup, isSignedIn)}
    />
  )
}
