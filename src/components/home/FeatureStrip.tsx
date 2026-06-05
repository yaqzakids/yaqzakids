type FeatureStripVariant = 'discoverer' | 'thinker'

interface FeatureStripProps {
  variant: FeatureStripVariant
}

const discovererFeatures = ['🛡️ Safe & Ad-Free', '☪️ Islamic Values', '👨‍👩‍👧 Parent Dashboard', '🏆 Earn Rewards']
const thinkerFeatures = ['🔍 Deep Analysis', '☪️ Islamic Perspective', '💭 Critical Thinking', '🏆 Earn XP & Badges']

export default function FeatureStrip({ variant }: FeatureStripProps) {
  const features = variant === 'thinker' ? thinkerFeatures : discovererFeatures
  const isDark = variant === 'thinker'

  return (
    <section className={`py-6 px-6 ${isDark ? 'bg-[#243B6E] text-white' : 'bg-white'}`}>
      <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        {features.map((f) => (
          <div key={f} className={`text-sm font-bold ${isDark ? 'text-white/80' : 'text-navy'}`}>{f}</div>
        ))}
      </div>
    </section>
  )
}

export function AgeGroupCards() {
  const groups = [
    { name: 'Explorer', ages: 'Ages 5–8', bg: '#E8F5EE', border: '#4AAE8A', icon: '🌱', features: ['Short fun stories', 'Colourful adventures', 'Easy quizzes'] },
    { name: 'Discoverer', ages: 'Ages 9–12', bg: '#FDE8B8', border: '#E8A020', icon: '🔍', features: ['Real news & science', 'Daily missions', 'Earn XP points'] },
    { name: 'Thinker', ages: 'Ages 13–16', bg: '#EDE9FE', border: '#8B6BB1', icon: '🌍', features: ['Deep analysis', 'Critical thinking', 'Real-world challenges'] },
  ]

  return (
    <section className="bg-bg py-12 px-6 md:px-10">
      <h2 className="font-display text-2xl md:text-3xl font-bold text-navy text-center mb-10">Same world. Right level.</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
        {groups.map((g) => (
          <div key={g.name} className="rounded-2xl p-6 border-2" style={{ background: g.bg, borderColor: g.border }}>
            <span className="text-3xl mb-3 block">{g.icon}</span>
            <h3 className="font-display text-xl font-bold text-navy mb-1">{g.name}</h3>
            <p className="text-sm font-bold mb-4" style={{ color: g.border }}>{g.ages}</p>
            <ul className="space-y-2">
              {g.features.map((f) => (
                <li key={f} className="text-sm text-muted flex items-center gap-2">
                  <span className="text-teal">✓</span> {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
