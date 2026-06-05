import { Link } from 'react-router-dom'

type CTABandVariant = 'explorer' | 'discoverer' | 'thinker'

interface CTABandProps {
  variant?: CTABandVariant
}

export default function CTABand({ variant = 'explorer' }: CTABandProps) {
  const isDiscoverer = variant === 'discoverer'
  const isThinker = variant === 'thinker'

  if (isThinker) {
    return (
      <section className="bg-gold py-16 px-6 md:px-10 text-center">
        <h2 className="font-display text-2xl md:text-[32px] font-extrabold text-navy mb-3">
          Ready to think deeper?
        </h2>
        <p className="text-navy/70 mb-7">Join Muslim teens exploring the world with faith and curiosity.</p>
        <Link to="/signup" className="inline-block bg-navy text-white px-9 py-3.5 rounded-full text-base font-extrabold hover:opacity-90 transition-opacity">
          Get Started Free →
        </Link>
      </section>
    )
  }

  return (
    <section className={`py-16 px-6 md:px-10 text-center ${isDiscoverer ? 'bg-teal' : 'bg-gold'}`}>
      <h2 className={`font-display text-2xl md:text-[32px] font-extrabold mb-3 ${isDiscoverer ? 'text-white' : 'text-navy'}`}>
        {isDiscoverer ? "Start your child's learning journey today." : "Start your child's adventure today!"}
      </h2>
      <p className={`mb-7 ${isDiscoverer ? 'text-white/80' : 'text-navy/70'}`}>
        Join the growing community of Muslim families.
      </p>
      <Link
        to="/signup"
        className={`inline-block px-9 py-3.5 rounded-full text-base font-extrabold hover:opacity-90 transition-opacity ${
          isDiscoverer ? 'bg-navy text-white' : 'bg-navy text-white'
        }`}
      >
        {isDiscoverer ? 'Get Started Free →' : 'Join Free! ⭐'}
      </Link>
      <p className={`text-[13px] mt-3 ${isDiscoverer ? 'text-white/60' : 'text-navy/60'}`}>
        Free forever · Cancel anytime · EN, FR, AR
      </p>
    </section>
  )
}
