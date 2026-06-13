import { AgeHomepage } from '../components/AgeHomepage'
import { thinkerHomepageConfig } from '../lib/ageHomepageConfigs'

export default function Thinker() {
  return (
    <div className="page-transition">
      <AgeHomepage {...thinkerHomepageConfig} />
    </div>
  )
}
