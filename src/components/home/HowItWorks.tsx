type HowItWorksVariant = 'explorer' | 'discoverer' | 'thinker'

interface HowItWorksProps {
  variant?: HowItWorksVariant
}

const steps = {
  explorer: [
    { step: 'STEP 1', stepColor: 'text-gold', iconBg: '#FEF3C7', iconColor: '#F5A623', icon: '👋', title: 'Join for free!', desc: 'Ask a grown-up to sign you up!' },
    { step: 'STEP 2', stepColor: 'text-teal', iconBg: '#DCFCE7', iconColor: '#2AAFA0', icon: '📚', title: 'Pick a story!', desc: 'Choose from animals, space, Islam and more!' },
    { step: 'STEP 3', stepColor: 'text-purple', iconBg: '#EDE9FE', iconColor: '#8B6BB1', icon: '⭐', title: 'Learn and earn!', desc: 'Read and collect stars and badges!' },
  ],
  discoverer: [
    { step: 'STEP 1', stepColor: 'text-teal', iconBg: '#DCFCE7', iconColor: '#2AAFA0', icon: '👤', title: 'Create account', desc: 'Sign up and add your child profile.' },
    { step: 'STEP 2', stepColor: 'text-gold', iconBg: '#FEF3C7', iconColor: '#F5A623', icon: '📖', title: 'Explore stories', desc: 'Read daily news and science adapted for you.' },
    { step: 'STEP 3', stepColor: 'text-purple', iconBg: '#EDE9FE', iconColor: '#8B6BB1', icon: '☪️', title: 'Connect to faith', desc: 'Discover how Islam guides us in the world.' },
  ],
  thinker: [
    { step: 'STEP 1', stepColor: 'text-gold', iconBg: '#FEF3C7', iconColor: '#F5A623', icon: '🔍', title: 'Analyse', desc: 'Read in-depth articles on real-world topics.' },
    { step: 'STEP 2', stepColor: 'text-teal', iconBg: '#DCFCE7', iconColor: '#2AAFA0', icon: '💭', title: 'Question', desc: 'Develop critical thinking skills.' },
    { step: 'STEP 3', stepColor: 'text-purple', iconBg: '#EDE9FE', iconColor: '#8B6BB1', icon: '🌱', title: 'Grow', desc: 'Apply Islamic values to modern challenges.' },
  ],
}

export default function HowItWorks({ variant = 'explorer' }: HowItWorksProps) {
  const isDark = variant === 'thinker'
  const isDiscoverer = variant === 'discoverer'
  const currentSteps = steps[variant]

  return (
    <section className={`py-12 px-6 md:px-10 ${isDark ? 'bg-navy' : isDiscoverer ? 'bg-white' : 'bg-[#FFFBF0]'}`}>
      {!isDiscoverer && (
        <p className={`text-center text-xs font-extrabold tracking-[2px] uppercase mb-2 ${isDark ? 'text-gold' : 'text-gold'}`}>
          HOW IT WORKS
        </p>
      )}
      <h2 className={`font-display text-2xl md:text-[32px] font-bold text-center mb-10 ${isDark ? 'text-white' : 'text-navy'}`}>
        {isDiscoverer ? 'Three steps to a curious, grounded child' : isDark ? 'Three steps to deeper understanding' : 'How it works — super easy!'}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {currentSteps.map((s) => (
          <div key={s.step} className={`rounded-[20px] p-8 text-center shadow-md ${isDark ? 'bg-[#243B6E]' : 'bg-white'}`}>
            <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center mx-auto mb-4 text-2xl" style={{ background: s.iconBg, color: s.iconColor }}>
              {s.icon}
            </div>
            <p className={`text-[10px] font-extrabold tracking-[2px] uppercase mb-2 ${s.stepColor}`}>{s.step}</p>
            <h3 className={`font-display text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-navy'}`}>{s.title}</h3>
            <p className={`text-sm leading-relaxed ${isDark ? 'text-white/70' : 'text-muted'}`}>{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
