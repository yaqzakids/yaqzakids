import { ThinkerNavbar } from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import HeroSection from '../components/home/HeroSection'
import FeatureStrip from '../components/home/FeatureStrip'
import HowItWorks from '../components/home/HowItWorks'
import Gamification from '../components/home/Gamification'
import ArticleGrid from '../components/home/ArticleGrid'
import FaithSection from '../components/home/FaithSection'
import Pricing from '../components/home/Pricing'
import CTABand from '../components/home/CTABand'

export default function Thinker() {
  return (
    <div className="page-transition bg-navy">
      <ThinkerNavbar />
      <HeroSection variant="thinker" />
      <FeatureStrip variant="thinker" />
      <HowItWorks variant="thinker" />
      <Gamification variant="thinker" />
      <ArticleGrid variant="thinker" label="TODAY'S ANALYSIS" title="Deep dives for curious minds" />
      <FaithSection variant="thinker" />
      <Pricing variant="thinker" />
      <CTABand variant="thinker" />
      <Footer variant="dark" />
    </div>
  )
}
