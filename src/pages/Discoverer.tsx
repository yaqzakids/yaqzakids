import AgeHomeShell from '@/components/childHome/AgeHomeShell'
import SignedOutDiscovererHero from '@/components/discoverer/SignedOutDiscovererHero'
import LearningPathsGrid from '@/components/discoverer/home/LearningPathsGrid'
import RootedInFaithSection from '@/components/discoverer/home/RootedInFaithSection'
import SignedOutFeaturedSection from '@/components/discoverer/home/SignedOutFeaturedSection'
import {
  ForParentsSection,
  PricingTeaserSection,
} from '@/components/discoverer/home/SignedOutSections'
import { useEffect, useState } from 'react'
import { useAuth } from '@/components/ProtectedRoute'
import { fetchDiscovererHomepageData } from '@/lib/discoverer'
import type { PathWithProgress } from '@/lib/adventure/types'

function SignedOutDiscovererHome() {
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
    <>
      <SignedOutDiscovererHero />
      <div className="max-w-[1280px] mx-auto px-5 md:px-8 bg-[#EEF4FF]">
        <LearningPathsGrid isSignedIn={false} allPaths={allPaths} ageGroup="discoverer" />
      </div>
      <RootedInFaithSection />
      <SignedOutFeaturedSection />
    </>
  )
}

export default function Discoverer() {
  return (
    <AgeHomeShell
      ageGroup="discoverer"
      pageBg="bg-[#EEF4FF]"
      footerVariant="light"
      signedOutContent={<SignedOutDiscovererHome />}
      signedOutFooter={
        <div className="pt-4">
          <ForParentsSection />
          <PricingTeaserSection />
        </div>
      }
    />
  )
}
