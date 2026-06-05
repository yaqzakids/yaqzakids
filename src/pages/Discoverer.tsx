import { DiscovererNavbar } from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import HeroSection from '../components/home/HeroSection'
import FeatureStrip from '../components/home/FeatureStrip'
import TopicsGrid from '../components/home/TopicsGrid'
import HowItWorks from '../components/home/HowItWorks'
import { AgeGroupCards } from '../components/home/FeatureStrip'
import Gamification from '../components/home/Gamification'
import ArticleGrid from '../components/home/ArticleGrid'
import Pricing from '../components/home/Pricing'
import CTABand from '../components/home/CTABand'

export default function Discoverer() {
  return (
    <div className="page-transition">
      <DiscovererNavbar />
      <HeroSection variant="discoverer" />
      <FeatureStrip variant="discoverer" />
      <TopicsGrid />
      <HowItWorks variant="discoverer" />
      <AgeGroupCards />
      <Gamification variant="discoverer" />
      <ArticleGrid variant="discoverer" label="TODAY'S TOP STORIES" title="Stories worth reading today" />
      <Pricing variant="discoverer" />
      <CTABand variant="discoverer" />
      <Footer />
    </div>
  )
}
