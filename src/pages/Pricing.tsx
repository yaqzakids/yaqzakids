import Footer from '../components/layout/Footer'
import Pricing from '../components/home/Pricing'
import CTABand from '../components/home/CTABand'
import { IMAGES } from '../lib/constants'

export default function PricingPage() {
  return (
    <div className="page-transition min-h-screen bg-bg">
      <nav className="bg-white border-b border-gray-200 px-6 md:px-10 h-16 flex items-center">
        <a href="/"><img src={IMAGES.logo} alt="Yaqza Kids" className="h-12" /></a>
      </nav>
      <div className="py-8">
        <Pricing />
      </div>
      <CTABand />
      <Footer />
    </div>
  )
}
