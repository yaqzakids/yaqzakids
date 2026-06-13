import Footer from '../components/layout/Footer'
import Pricing from '../components/home/Pricing'
import CTABand from '../components/home/CTABand'

export default function PricingPage() {
  return (
    <div className="page-transition min-h-screen bg-bg">
      <nav className="bg-white border-b border-gray-200 px-6 md:px-10 h-16 flex items-center" />
      <div className="py-8">
        <Pricing />
      </div>
      <CTABand />
      <Footer />
    </div>
  )
}
