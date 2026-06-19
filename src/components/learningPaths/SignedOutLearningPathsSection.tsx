import { useEffect, useState } from 'react'
import { useAuth } from '@/components/ProtectedRoute'
import LearningPathsSection from '@/components/learningPaths/LearningPathsSection'
import { fetchDiscovererHomepageData } from '@/lib/discoverer'
import { learningPathsSubtitleForAge } from '@/lib/learningPathsSectionConfig'
import type { PathWithProgress } from '@/lib/adventure/types'
import type { AgeGroup } from '@/lib/types'

export default function SignedOutLearningPathsSection({ ageGroup }: { ageGroup: AgeGroup }) {
  const { user } = useAuth()
  const [allPaths, setAllPaths] = useState<PathWithProgress[]>([])

  useEffect(() => {
    let cancelled = false
    fetchDiscovererHomepageData(null, user?.id ?? null)
      .then((home) => {
        if (!cancelled) setAllPaths(home.allPaths)
      })
      .catch(() => {
        if (!cancelled) setAllPaths([])
      })
    return () => {
      cancelled = true
    }
  }, [user?.id])

  return (
    <LearningPathsSection
      isSignedIn={false}
      allPaths={allPaths}
      subtitle={learningPathsSubtitleForAge(ageGroup, false)}
    />
  )
}
