import { Link } from 'react-router-dom'
import { DISCOVERER_HERO_IMAGE } from '@/components/discoverer/DiscovererHeroShell'

export default function SignedOutDiscovererHero() {
  return (
    <section className="relative overflow-hidden bg-[#FDF9F0]">
      {/* Illustration backdrop */}
      <div className="relative min-h-[480px] md:min-h-[560px] flex flex-col">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${DISCOVERER_HERO_IMAGE})` }}
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#FDF9F0] via-[#FDF9F0]/75 to-[#FDF9F0]/20"
          aria-hidden
        />

        {/* Headline + CTAs anchored at bottom */}
        <div className="relative z-10 mt-auto max-w-[1280px] mx-auto w-full px-5 md:px-8 pb-10 md:pb-14 pt-32 md:pt-40">
          <h1 className="font-display font-bold text-[#1B2F5E] leading-[1.1] mb-4 text-[clamp(2rem,4.5vw,3.25rem)] max-w-3xl">
            Discover{' '}
            <span className="text-[#148281]">Allah&apos;s World</span>, One Story at a Time.
          </h1>
          <p className="text-[#1B2F5E]/80 text-base md:text-lg leading-relaxed mb-8 max-w-2xl">
            Read exciting stories about science, nature, history, technology and today&apos;s world
            through curiosity, reflection and Islamic values.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-extrabold text-white bg-[#148281] hover:opacity-90 shadow-lg text-[15px]"
            >
              <span aria-hidden>⭐</span>
              Start Today&apos;s Mission
            </Link>
            <Link
              to="/sample-stories"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-extrabold border-2 border-[#148281] text-[#148281] bg-white hover:bg-[#FDF9F0] text-[15px] shadow-sm"
            >
              <span aria-hidden>📖</span>
              Explore Stories
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
