import AgeHomeShell from '@/components/childHome/AgeHomeShell'
import SignedOutLearningPathsSection from '@/components/learningPaths/SignedOutLearningPathsSection'
import { AgeHomepage } from '@/components/AgeHomepage'
import { thinkerHomepageConfig } from '@/lib/ageHomepageConfigs'

const learningPathsAfterHero = (
  <div className="max-w-[1280px] mx-auto px-5 md:px-8 py-2">
    <SignedOutLearningPathsSection ageGroup="thinker" />
  </div>
)

export default function Thinker() {
  return (
    <AgeHomeShell
      ageGroup="thinker"
      pageBg="bg-navy"
      footerVariant="dark"
      signedOutIncludesChrome
      signedOutContent={
        <div className="page-transition">
          <AgeHomepage {...thinkerHomepageConfig} afterHero={learningPathsAfterHero} />
        </div>
      }
    />
  )
}
