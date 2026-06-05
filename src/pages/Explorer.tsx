import { ExplorerNavbar } from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import HeroSection from '../components/home/HeroSection'
import CategoryStrip from '../components/home/CategoryStrip'
import FeaturedStory from '../components/home/FeaturedStory'
import HowItWorks from '../components/home/HowItWorks'
import Gamification from '../components/home/Gamification'
import ArticleGrid from '../components/home/ArticleGrid'
import FaithSection from '../components/home/FaithSection'
import Pricing from '../components/home/Pricing'
import CTABand from '../components/home/CTABand'

export default function Explorer() {
  return (
    <div className="page-transition">
      <ExplorerNavbar />
      <HeroSection variant="explorer" />
      <CategoryStrip />
      <FeaturedStory />
      <HowItWorks variant="explorer" />
      <Gamification variant="explorer" />
      <ArticleGrid variant="explorer" />
      <FaithSection />
      <Pricing variant="explorer" />
      <CTABand variant="explorer" />
      <Footer />
    </div>
  )
}
