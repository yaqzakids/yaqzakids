import { useEffect, useState } from 'react'
import Pricing from '../components/home/Pricing'
import CTABand from '../components/home/CTABand'
import PageSeo from '@/components/seo/PageSeo'
import { PAGE_SEO_PRESETS } from '@/lib/seo/siteSeo'
import PublicLayout from '@/components/layout/PublicLayout'
import LoadingSpinner from '@/components/LoadingSpinner'
import { DEFAULT_SUBSCRIPTION_PLANS, fetchSubscriptionPlans, plansToDisplay, type PricingPlanDisplay } from '@/lib/platform/subscriptionPlans'

export default function PricingPage() {
  const [plans, setPlans] = useState<PricingPlanDisplay[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchSubscriptionPlans()
      .then((data) => {
        if (!cancelled) setPlans(plansToDisplay(data))
      })
      .catch(() => {
        if (!cancelled) setPlans(plansToDisplay(DEFAULT_SUBSCRIPTION_PLANS))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <PublicLayout bg="bg-bg">
      <PageSeo {...PAGE_SEO_PRESETS.pricing} path="/pricing" />
      <div className="py-8">
        {loading ? (
          <div className="py-16 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          <Pricing plans={plans} />
        )}
      </div>
      <CTABand />
    </PublicLayout>
  )
}
