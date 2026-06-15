import Pricing from '../components/home/Pricing'
import CTABand from '../components/home/CTABand'
import PageSeo from '@/components/seo/PageSeo'
import { PAGE_SEO_PRESETS } from '@/lib/seo/siteSeo'
import PublicLayout from '@/components/layout/PublicLayout'

export default function PricingPage() {
  return (
    <PublicLayout bg="bg-bg">
      <PageSeo {...PAGE_SEO_PRESETS.pricing} path="/pricing" />
      <div className="py-8">
        <Pricing />
      </div>
      <CTABand />
    </PublicLayout>
  )
}
