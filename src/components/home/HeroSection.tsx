import { Link } from 'react-router-dom'

type HeroVariant = 'explorer' | 'discoverer' | 'thinker'

interface HeroSectionProps {
  variant: HeroVariant
}

const heroConfig: Record<HeroVariant, {
  bg: string
  overlay: string
  badge: React.ReactNode
  title: React.ReactNode
  subtitle: string
  primaryBtn: string
  secondaryBtn: string
  badges?: { text: string; bg: string; color: string }[]
  trustRow?: string
}> = {
  explorer: {
    bg: 'https://i.ibb.co/8DbgpyNZ/Jun-2-2026-11-10-16-PM.png',
    overlay: 'linear-gradient(to right, rgba(255,251,240,0.97) 0%, rgba(255,251,240,0.92) 40%, transparent 100%)',
    badge: 'Fun Learning for Young Muslims!',
    title: (
      <>
        <span className="text-navy">Learn About </span>
        <span className="text-gold">Your Amazing </span>
        <span className="text-navy">World! 🚀</span>
      </>
    ),
    subtitle: 'Super fun stories about science, animals, news and Islam — just for you! Earn stars and badges as you learn!',
    primaryBtn: '⭐ Start My Adventure!',
    secondaryBtn: 'Watch a Story',
    badges: [
      { text: '🎯 Easy to Read', bg: '#FEF3C7', color: '#92400E' },
      { text: '🎨 Fun Activities', bg: '#DCFCE7', color: '#166534' },
      { text: '🏆 Earn Badges', bg: '#EDE9FE', color: '#5B21B6' },
      { text: '☪️ Islamic Values', bg: '#DBEAFE', color: '#1E40AF' },
    ],
  },
  discoverer: {
    bg: 'https://i.ibb.co/pjFS3JM6/Chat-GPT-Image-Jun-3-2026-04-45-19-PM.png',
    overlay: 'linear-gradient(to right, rgba(238,244,255,0.97) 0%, rgba(238,244,255,0.92) 40%, transparent 100%)',
    badge: '🌍 Daily News • Science • Discovery • Faith',
    title: (
      <>
        <span className="text-navy">Raise Curious, </span>
        <span className="text-teal">Confident </span>
        <span className="text-navy">Muslim Children</span>
      </>
    ),
    subtitle: 'Daily news, science, technology and positive stories adapted for ages 9–12.',
    primaryBtn: 'Start Reading Free →',
    secondaryBtn: "Explore Today's Stories",
    trustRow: '👤 Ages 9–12 · 🌍 EN•FR•AR · 🛡️ Safe & Ad-Free · 👨‍👩‍👧 Family Plans',
  },
  thinker: {
    bg: 'https://i.ibb.co/tTgr2xFx/Chat-GPT-Image-Jun-3-2026-04-59-24-PM.png',
    overlay: 'linear-gradient(to right, rgba(27,47,94,0.97) 0%, rgba(27,47,94,0.92) 40%, transparent 100%)',
    badge: 'Analysis • Perspective • Critical Thinking',
    title: (
      <>
        <span className="text-white">Think Deeper. </span>
        <span className="text-teal">Question More. </span>
        <span className="text-gold">Grow Stronger.</span>
      </>
    ),
    subtitle: 'Deep analysis, real-world challenges and critical thinking for sharp young minds ages 13–16.',
    primaryBtn: 'Start Analysing →',
    secondaryBtn: "Today's Analysis",
  },
}

export default function HeroSection({ variant }: HeroSectionProps) {
  const config = heroConfig[variant]
  const isThinker = variant === 'thinker'
  const isDiscoverer = variant === 'discoverer'

  return (
    <section className="relative w-full min-h-[520px] md:min-h-[580px] overflow-hidden">
      <img src={config.bg} alt="" className="absolute inset-0 w-full h-full object-cover object-center md:object-right" />
      <div className="absolute inset-0" style={{ background: config.overlay }} />
      <div className="relative z-10 px-6 md:px-10 py-16 md:py-20 max-w-xl">
        <span className={`inline-block rounded-full px-4 py-1.5 text-xs font-bold mb-5 ${
          isThinker
            ? 'bg-gold/20 text-gold border border-gold/30'
            : isDiscoverer
            ? 'border border-navy text-navy'
            : 'bg-[#FEF3C7] text-[#D4820A]'
        }`}>
          {config.badge}
        </span>
        <h1 className={`font-display text-4xl md:text-[52px] font-extrabold leading-tight mb-4 ${isThinker ? 'text-white' : ''}`}>
          {config.title}
        </h1>
        <p className={`text-base md:text-lg leading-relaxed mb-7 max-w-md ${isThinker ? 'text-white/75' : 'text-gray-700'}`}>
          {config.subtitle}
        </p>
        <div className="flex flex-wrap gap-3 mb-6">
          <Link
            to="/signup"
            className={`px-6 py-3 rounded-full text-[15px] font-extrabold transition-transform hover:-translate-y-0.5 ${
              isThinker ? 'bg-gold text-navy' : 'bg-gold text-white'
            }`}
          >
            {config.primaryBtn}
          </Link>
          <button className={`px-6 py-3 rounded-full text-[15px] font-bold border-2 transition-transform hover:-translate-y-0.5 ${
            isThinker
              ? 'border-white text-white bg-transparent'
              : isDiscoverer
              ? 'border-navy text-navy bg-transparent'
              : 'border-gold text-[#D4820A] bg-transparent'
          }`}>
            {config.secondaryBtn}
          </button>
        </div>
        {config.badges && (
          <div className="flex flex-wrap gap-2">
            {config.badges.map((b) => (
              <span key={b.text} className="px-3 py-1 rounded-full text-[11px] font-bold" style={{ background: b.bg, color: b.color }}>
                {b.text}
              </span>
            ))}
          </div>
        )}
        {config.trustRow && (
          <p className="text-sm text-muted mt-4">{config.trustRow}</p>
        )}
      </div>
    </section>
  )
}
