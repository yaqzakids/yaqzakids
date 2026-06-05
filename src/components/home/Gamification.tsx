import { Link } from 'react-router-dom'

type GamificationVariant = 'explorer' | 'discoverer' | 'thinker'

interface GamificationProps {
  variant?: GamificationVariant
}

const items = [
  { icon: '⭐', title: 'Earn Stars!', desc: 'Get a star every time you finish a story!' },
  { icon: '🚀', title: 'Level Up!', desc: 'The more you read the higher you go!' },
  { icon: '🔥', title: 'Come Back Daily!', desc: 'Build your streak and win bonus stars!' },
  { icon: '🎖️', title: 'Collect Badges!', desc: 'Earn special badges for being amazing!' },
]

const discovererItems = [
  { icon: '⚡', title: 'XP Points', desc: 'Earn points with every article you read.' },
  { icon: '🏆', title: 'Level Up', desc: 'Progress through levels as you learn.' },
  { icon: '🔥', title: 'Daily Streaks', desc: 'Keep your learning streak alive.' },
  { icon: '🎖️', title: 'Badges', desc: 'Unlock achievements for milestones.' },
]

export default function Gamification({ variant = 'explorer' }: GamificationProps) {
  const isDark = variant === 'discoverer' || variant === 'thinker'
  const displayItems = isDark ? discovererItems : items

  return (
    <section
      className={`py-12 px-6 md:px-10 text-center ${isDark ? 'bg-navy' : ''}`}
      style={!isDark ? { background: 'linear-gradient(135deg, #F5A623, #E8941A)' } : undefined}
    >
      <p className={`text-xs font-extrabold tracking-[2px] uppercase mb-2 ${isDark ? 'text-gold' : 'text-white'}`}>
        LEARN. EARN. GROW.
      </p>
      <h2 className={`font-display text-2xl md:text-[32px] font-bold mb-10 ${isDark ? 'text-white' : 'text-white'}`}>
        Learning that feels like an adventure{variant === 'discoverer' ? '' : '!'}
      </h2>
      <div className="flex flex-wrap justify-center gap-8 md:gap-12">
        {displayItems.map((item) => (
          <div key={item.title} className="flex flex-col items-center max-w-[140px]">
            <div className="bg-white w-[72px] h-[72px] rounded-full flex items-center justify-center text-2xl mb-4">
              {item.icon}
            </div>
            <h3 className={`font-extrabold text-lg mb-1.5 ${isDark ? 'text-white' : 'text-white'}`}>{item.title}</h3>
            <p className={`text-[13px] text-center ${isDark ? 'text-white/70' : 'text-white/85'}`}>{item.desc}</p>
          </div>
        ))}
      </div>
      <Link
        to="/signup"
        className={`inline-block mt-8 px-8 py-3 rounded-full text-[15px] font-extrabold transition-transform hover:-translate-y-0.5 ${
          isDark ? 'bg-gold text-navy' : 'bg-white text-gold'
        }`}
      >
        {isDark ? 'Start Earning XP!' : 'Start Earning Stars!'}
      </Link>
    </section>
  )
}
