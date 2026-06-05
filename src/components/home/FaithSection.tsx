import { Link } from 'react-router-dom'

type FaithSectionVariant = 'explorer' | 'thinker'

interface FaithSectionProps {
  variant?: FaithSectionVariant
}

export default function FaithSection({ variant = 'explorer' }: FaithSectionProps) {
  const isDark = variant === 'thinker'

  return (
    <section className={`py-12 px-6 md:px-10 ${isDark ? 'bg-navy' : 'bg-[#FFFBF0]'}`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
        <div className={`rounded-2xl p-6 border-t-4 border-teal ${isDark ? 'bg-[#243B6E]' : 'bg-white'}`}>
          <p className="text-teal text-[11px] font-extrabold uppercase mb-3">☪️ WHAT ISLAM TEACHES</p>
          <h3 className={`font-display text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-navy'}`}>Seek Knowledge</h3>
          <p className="text-teal text-lg text-right mb-3" dir="rtl">طَلَبُ الْعِلْمِ فَرِيضَةٌ</p>
          <p className={`text-sm italic mb-4 ${isDark ? 'text-white/60' : 'text-muted'}`}>
            Seeking knowledge is an obligation upon every Muslim. — Ibn Majah
          </p>
          <Link to="/signup" className="text-teal text-sm font-bold hover:opacity-80">Read More →</Link>
        </div>

        <div className={`rounded-2xl p-6 border-t-4 border-gold ${isDark ? 'bg-[#243B6E]' : 'bg-white'}`}>
          <p className="text-gold text-[11px] font-extrabold uppercase mb-3">💡 THINK ABOUT IT</p>
          <p className={`italic text-base mb-5 ${isDark ? 'text-white/80' : 'text-navy'}`}>
            If you could fly to the Moon, what three things would you bring?
          </p>
          <button className="bg-gold text-white px-5 py-2 rounded-full text-sm font-bold hover:opacity-90 transition-opacity">
            Share Your Thoughts
          </button>
        </div>

        <div className={`rounded-2xl p-6 border-t-4 border-purple ${isDark ? 'bg-[#243B6E]' : 'bg-white'}`}>
          <p className="text-purple text-[11px] font-extrabold uppercase mb-3">🎨 ACTIVITY CORNER</p>
          <h3 className={`font-display text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-navy'}`}>Draw Your Favourite Animal</h3>
          <p className={`text-sm mb-5 ${isDark ? 'text-white/60' : 'text-muted'}`}>
            Draw and label your favourite animal. Write one amazing fact about it!
          </p>
          <button className="border-2 border-purple text-purple px-5 py-2 rounded-full text-sm font-bold hover:bg-purple/5 transition-colors">
            Start Activity
          </button>
        </div>
      </div>
    </section>
  )
}
