import { AgeHomepage } from '@/components/AgeHomepage'
import AgeHomeShell from '@/components/childHome/AgeHomeShell'
import { explorerHomepageConfig } from '@/lib/ageHomepageConfigs'

export default function Explorer() {
  return (
    <AgeHomeShell
      ageGroup="explorer"
      pageBg="bg-cream"
      footerVariant="light"
      signedOutIncludesChrome
      signedOutContent={
        <div className="page-transition">
          <AgeHomepage {...explorerHomepageConfig} />
        </div>
      }
    />
  )
}
