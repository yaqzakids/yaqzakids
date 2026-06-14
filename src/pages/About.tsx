import Footer from '../components/layout/Footer'
import CTABand from '../components/home/CTABand'
import PageSeo from '@/components/seo/PageSeo'
import { PAGE_SEO_PRESETS } from '@/lib/seo/siteSeo'

export default function About() {
  return (
    <div className="page-transition min-h-screen bg-bg">
      <PageSeo {...PAGE_SEO_PRESETS.about} path="/about" />
      <nav className="bg-white border-b border-gray-200 px-6 md:px-10 h-16 flex items-center" />
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
      <Footer />
    </div>
  )
}
