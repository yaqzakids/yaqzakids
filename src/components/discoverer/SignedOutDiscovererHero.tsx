import { Link } from 'react-router-dom'
import DiscovererHeroShell from '@/components/discoverer/DiscovererHeroShell'

const TRUST_BADGES = [
  { icon: '🌙', label: 'Muslim-rooted learning' },
  { icon: '🔬', label: 'Science & discovery' },
  { icon: '✨', label: 'Ages 9–12' },
  { icon: '🛡️', label: 'Safe for families' },
] as const

export default function SignedOutDiscovererHero() {
  return (
    <DiscovererHeroShell>
      <div className="max-w-xl">
        <p className="text-[#2AAFA0] text-xs font-extrabold tracking-widest uppercase mb-3">
          YaqzaKids Discoverers
        </p>
        <h1 className="font-display font-bold text-[#1B2F5E] leading-[1.12] mb-4 text-[clamp(1.85rem,3.5vw,48px)] drop-shadow-sm">
          Explore Allah&apos;s world through{' '}
          <span className="text-[#F5A623]">stories, science & faith</span>
        </h1>
        <p className="text-[#1B2F5E]/80 text-[17px] leading-relaxed mb-6 max-w-[500px]">
          A joyful learning adventure for curious kids — read exciting stories, earn stars,
          build character, and grow through Islamic values. No school portal. Just discovery.
        </p>
        <div className="flex flex-wrap gap-3 mb-8">
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full font-extrabold text-white bg-[#2AAFA0] hover:opacity-90 shadow-md text-[15px]"
          >
            ✨ Start Free
          </Link>
          <Link
            to="/sample-stories"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full font-extrabold border-2 border-[#1B2F5E] text-[#1B2F5E] bg-white/90 backdrop-blur-sm text-[15px] hover:bg-white"
          >
            📚 Explore Sample Stories
          </Link>
        </div>
        <div className="flex flex-wrap gap-3">
          {TRUST_BADGES.map((badge) => (
            <span
              key={badge.label}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-white/95 text-[#1B2F5E] shadow-[0_4px_16px_rgba(27,47,94,0.12)] backdrop-blur-sm"
            >
              <span aria-hidden>{badge.icon}</span>
              {badge.label}
            </span>
          ))}
        </div>
      </div>
    </DiscovererHeroShell>
  )
}
