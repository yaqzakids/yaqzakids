import AgeHomeShell from '@/components/childHome/AgeHomeShell'
import { AgeHomepage } from '@/components/AgeHomepage'
import { thinkerHomepageConfig } from '@/lib/ageHomepageConfigs'

export default function Thinker() {
  return (
    <AgeHomeShell
      ageGroup="thinker"
      pageBg="bg-navy"
      footerVariant="dark"
      signedOutIncludesChrome
      signedOutContent={
        <div className="page-transition">
          <AgeHomepage {...thinkerHomepageConfig} />
        </div>
      }
    />
  )
}
