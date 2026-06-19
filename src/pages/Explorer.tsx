import AgeHomeShell from '@/components/childHome/AgeHomeShell'
import SignedOutLearningPathsSection from '@/components/learningPaths/SignedOutLearningPathsSection'
import { AgeHomepage } from '@/components/AgeHomepage'
import { explorerHomepageConfig } from '@/lib/ageHomepageConfigs'

const learningPathsAfterHero = (
  <div className="max-w-[1280px] mx-auto px-5 md:px-8 py-2">
    <SignedOutLearningPathsSection ageGroup="explorer" />
  </div>
)

export default function Explorer() {
  return (
    <AgeHomeShell
      ageGroup="explorer"
      pageBg="bg-cream"
      footerVariant="light"
      signedOutIncludesChrome
      signedOutContent={
        <div className="page-transition">
          <AgeHomepage {...explorerHomepageConfig} afterHero={learningPathsAfterHero} />
        </div>
      }
    />
  )
}
