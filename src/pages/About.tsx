import CTABand from '../components/home/CTABand'
import PageSeo from '@/components/seo/PageSeo'
import { PAGE_SEO_PRESETS } from '@/lib/seo/siteSeo'
import PublicLayout from '@/components/layout/PublicLayout'

export default function About() {
  return (
    <PublicLayout bg="bg-bg">
      <PageSeo {...PAGE_SEO_PRESETS.about} path="/about" />
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h1 className="font-display text-4xl font-extrabold text-navy mb-6">About Yaqza Kids</h1>
        <p className="text-lg text-muted leading-relaxed mb-6">
          Yaqza Kids is an Islamic EdTech platform helping Muslim children ages 5–16 explore the world through faith, curiosity and knowledge.
        </p>
        <p className="text-muted leading-relaxed">
          Rooted in Faith. Awake to the World. — Tomorrow's Ummah starts with today's learners.
        </p>
      </div>
      <CTABand />
    </PublicLayout>
  )
}
