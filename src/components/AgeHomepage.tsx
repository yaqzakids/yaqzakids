import { Link } from 'react-router-dom'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { Star, Rocket, Flame, Award } from 'lucide-react'

export type AgeVariant = 'explorer' | 'discoverer' | 'thinker'

export interface AgeHomepageConfig {
  variant: AgeVariant
  heroBg: string
  heroOverlay: string
  pageBg?: string
  pillText: string
  headlineParts: { text: string; color: string }[]
  subtitle: string
  subtitleColor?: string
  primaryCta: { label: string; cls: string }
  secondaryCta: { label: string; cls: string }
  trustText: string
  features: { icon: string; title: string }[]
  storiesLabel: string
  storiesHeadline: string
  storiesBg?: string
  storyCardCls?: string
  storyXp: string
  storyMeta: string
  featureStripCls?: string
  sectionLabelCls?: string
  sectionHeadlineCls?: string
}

const TOPICS = [
  { icon: '📰', title: 'World News', desc: "Today's events explained for young minds.", border: 'border-l-navy' },
  { icon: '🔬', title: 'Science & Discovery', desc: 'How the world works — from atoms to galaxies.', border: 'border-l-teal' },
  { icon: '🏛️', title: 'History & Civilizations', desc: 'Lessons from the past that shape today.', border: 'border-l-gold' },
  { icon: '🤖', title: 'Technology & AI', desc: 'Smart tools and how to use them wisely.', border: 'border-l-purple' },
  { icon: '🌱', title: 'Environment', desc: "Caring for the Earth as Allah's amanah.", border: 'border-l-[#4AAE8A]' },
  { icon: '🧭', title: 'Geography', desc: 'The Ummah and the world we share.', border: 'border-l-coral' },
]

const HOW_STEPS = [
  { icon: '👤', color: 'bg-teal', title: 'Create a free account', desc: 'Sign up in seconds. No credit card. Add up to 3 children.' },
  { icon: '📰', color: 'bg-gold', title: "Explore today's story", desc: "Fresh news daily, adapted for your child's age." },
  { icon: '🌙', color: 'bg-purple', title: 'Connect to faith', desc: 'Every story links to Islamic values and purpose.' },
]

const AGES = [
  { emoji: '🌱', title: 'Explorer', ages: 'Ages 5–8', bg: 'bg-[#E8F5EE]', border: 'border-[#4AAE8A]', items: ['Simple vocabulary', 'Short sentences', 'Drawing activities'] },
  { emoji: '🔍', title: 'Discoverer', ages: 'Ages 9–12', bg: 'bg-[#FDE8B8]', border: 'border-[#E8A020]', items: ['Expanded context', 'Critical thinking', 'Interactive quizzes'] },
  { emoji: '🌍', title: 'Thinker', ages: 'Ages 13–16', bg: 'bg-[#EDE9FE]', border: 'border-[#8B6BB1]', items: ['In-depth analysis', 'Multiple perspectives', 'Discussion forums'] },
]

const GAMIFY = [
  { icon: '⚡', title: 'XP Points', desc: 'Earn points for every mission completed' },
  { icon: '🏆', title: 'Level Up', desc: 'Rise from Seeker to Visionary' },
  { icon: '🔥', title: 'Daily Streaks', desc: 'Build powerful daily learning habits' },
  { icon: '🎖️', title: 'Badges', desc: 'Collect achievements as you grow' },
]

const STORIES = [
  { cat: 'World News', tag: 'bg-navy text-white', title: 'How nations are working together on clean water' },
  { cat: 'Science', tag: 'bg-teal text-white', title: 'What scientists just learned about deep oceans' },
  { cat: 'History', tag: 'bg-gold text-navy', title: 'The library of Baghdad and the love of learning' },
  { cat: 'Technology', tag: 'bg-purple text-white', title: 'How AI is helping doctors save more lives' },
  { cat: 'Environment', tag: 'bg-[#4AAE8A] text-white', title: 'Young Muslims planting forests across the world' },
  { cat: 'Geography', tag: 'bg-coral text-white', title: 'Five rivers that shaped Islamic civilization' },
]

const PRICING = [
  { name: 'Free', price: '$0', note: 'FREE FOREVER', noteCls: 'bg-teal/10 text-teal', border: 'border-border',
    features: ['5 articles / month', 'All 3 languages', '✗ Full archive', '✗ Worksheets', '✗ Parent insights'],
    cta: 'Get Started', ctaCls: 'border border-navy/30 text-navy hover:bg-navy hover:text-white' },
  { name: 'Family Monthly', price: '$9.99', per: '/month', note: 'MOST POPULAR', noteCls: 'bg-gold text-navy', border: 'border-2 border-gold',
    features: ['Daily stories', 'All 3 languages', '✓ Full archive', '✓ Worksheets', '✓ Parent insights'],
    cta: 'Start Monthly', ctaCls: 'bg-gold text-navy hover:bg-gold-dark hover:text-white' },
  { name: 'Family Yearly', price: '$79.99', per: '/year', note: 'BEST VALUE', noteCls: 'bg-teal text-white', border: 'border-border',
    features: ['Save 33% vs monthly', 'All features included', '✓ Full archive', '✓ Worksheets', '✓ Parent insights'],
    cta: 'Start Yearly', ctaCls: 'border border-navy/30 text-navy hover:bg-navy hover:text-white' },
  { name: 'School', price: '$299', per: '/year', note: 'FOR EDUCATORS', noteCls: 'bg-purple text-white', border: 'border-border',
    features: ['Up to 30 students', 'Teacher dashboard', 'All features', 'Classroom reports', 'Priority support'],
    cta: 'Contact Us', ctaCls: 'border border-navy/30 text-navy hover:bg-navy hover:text-white' },
]

const EXPLORER_HOW_STEPS = [
  { icon: '👤', color: 'bg-gold', title: 'Join for free!', desc: 'Ask a grown-up to sign you up in seconds!' },
  { icon: '📖', color: 'bg-teal', title: 'Pick a story!', desc: 'Choose a fun story about animals, space, Islam and more!' },
  { icon: '⭐', color: 'bg-purple', title: 'Learn and earn!', desc: 'Read stories and collect stars and badges!' },
]

const EXPLORER_CARD_IMG = 'https://i.ibb.co/8DbgpyNZ/Jun-2-2026-11-10-16-PM.png'

export function AgeHomepage(props: AgeHomepageConfig) {
  const cfg = props
  const isThinker = cfg.variant === 'thinker'
  const isExplorer = cfg.variant === 'explorer'
  const howSteps = isExplorer ? EXPLORER_HOW_STEPS : HOW_STEPS
  const howHeadline = isExplorer ? 'How it works — super easy!' : 'Three steps to a curious, grounded child'

  return (
    <div className={cfg.pageBg ?? 'bg-white'}>
      <SiteNav variant={isThinker ? 'light' : cfg.variant} />

      {/* HERO */}
      <section
        className="relative min-h-[580px] w-full"
        style={{ backgroundImage: `url(${cfg.heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center right' }}
      >
        <div className="absolute inset-0" style={{ background: cfg.heroOverlay }} />
        <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-12 md:pt-20">
          <div className="max-w-[520px]">
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${
              isThinker ? 'border-white/40 text-white' : 'border-navy/40 text-navy'
            }`}>{cfg.pillText}</span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-tight md:text-[54px] md:leading-[1.05]">
              {cfg.headlineParts.map((p, i) => (
                <span key={i} className={p.color}>{p.text}{i < cfg.headlineParts.length - 1 ? ' ' : ''}</span>
              ))}
            </h1>
            <p className={`mt-5 text-base md:text-[17px] ${cfg.subtitleColor ?? 'text-[#374151]'}`}>{cfg.subtitle}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/signup" className={`rounded-full px-6 py-3 text-sm font-extrabold shadow-md transition ${cfg.primaryCta.cls}`}>{cfg.primaryCta.label}</Link>
              <Link to="/discoverer" className={`rounded-full px-6 py-3 text-sm font-extrabold transition ${cfg.secondaryCta.cls}`}>{cfg.secondaryCta.label}</Link>
            </div>
            <p className={`mt-6 text-xs ${isThinker ? 'text-white/70' : 'text-navy/70'}`}>{cfg.trustText}</p>
            <div className={`mt-3 text-xl tracking-wider ${isThinker ? 'opacity-90' : ''}`}>​</div>
          </div>
        </div>
      </section>

      {/* CATEGORY STRIP */}
      {isExplorer && (
        <section style={{ background: '#FFFFFF', width: '100%' }}>
          <div style={{ width: '100%', padding: '28px 40px', boxSizing: 'border-box' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: '16px',
                flexWrap: 'nowrap',
                width: '100%',
              }}
            >
              {[
                { name: 'Amazing Animals', bg: '#FEF9C3', img: 'https://i.ibb.co/HfGGfqTb/Chat-GPT-Image-Jun-4-2026-02-40-58-PM.png', to: '/about' },
                { name: 'Our World', bg: '#DBEAFE', img: 'https://i.ibb.co/Qwk4M1Q/Chat-GPT-Image-Jun-4-2026-02-40-30-PM.png', to: '/about' },
                { name: 'Islam & Good Character', bg: '#EDE9FE', img: 'https://i.ibb.co/gFRNB3Jk/Chat-GPT-Image-Jun-4-2026-02-42-51-PM.png', to: '/about' },
                { name: 'Space Adventures', bg: '#DBEAFE', img: 'https://i.ibb.co/ns4zjTjM/Chat-GPT-Image-Jun-4-2026-02-44-34-PM.png', to: '/about' },
                { name: 'Nature Discoveries', bg: '#DCFCE7', img: 'https://i.ibb.co/8qrSkyC/Chat-GPT-Image-Jun-4-2026-02-47-03-PM.png', to: '/about' },
                { name: 'Healthy Habits', bg: '#FED7AA', img: 'https://i.ibb.co/Fd0pV30/Chat-GPT-Image-Jun-4-2026-02-46-59-PM.png', to: '/about' },
                { name: 'Story Time', bg: '#FEF9C3', img: 'https://i.ibb.co/HDhQ9Wxk/Chat-GPT-Image-Jun-4-2026-02-47-50-PM.png', to: '/about' },
              ].map((cat) => (
                <Link
                  key={cat.name}
                  to={cat.to}
                  style={{
                    flex: '1 1 0',
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '16px 12px',
                    cursor: 'pointer',
                    background: cat.bg,
                    borderRadius: '20px',
                    textDecoration: 'none',
                    transition: 'transform 0.2s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
                >
                  <img
                    src={cat.img}
                    alt={cat.name}
                    style={{
                      width: '120px',
                      height: '120px',
                      objectFit: 'cover',
                      borderRadius: '16px',
                      marginBottom: '10px',
                    }}
                  />
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#1B2F5E',
                      textAlign: 'center',
                      lineHeight: 1.3,
                    }}
                  >
                    {cat.name}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FEATURED STORY (explorer) */}
      {isExplorer && (
        <section style={{ position: 'relative', width: '100%', height: '400px', overflow: 'hidden', borderRadius: 0 }}>
          <img
            src="https://i.ibb.co/Z12Kh7qv/Chat-GPT-Image-Jun-4-2026-05-37-16-PM.png"
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '400px', objectFit: 'cover', objectPosition: 'center center' }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to right, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.5) 40%, transparent 100%)',
            }}
          />
          <div style={{ position: 'relative', zIndex: 2, padding: '48px 60px 48px 96px', maxWidth: '556px' }}>
            <div style={{ color: '#F5A623', fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>⭐ Featured Story</div>
            <h2 style={{ color: '#FFFFFF', fontFamily: "'Playfair Display', serif", fontSize: '36px', fontWeight: 800, lineHeight: 1.2, marginBottom: '14px' }}>
              Why Do Giraffes Have Long Necks?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontFamily: "'Nunito', sans-serif", fontSize: '16px', lineHeight: 1.7, marginBottom: '24px' }}>
              Find out how Allah created giraffes with amazing features and why they are so special!
            </p>
            <Link
              to="/about"
              style={{
                display: 'inline-block',
                background: '#2AAFA0',
                color: '#FFFFFF',
                borderRadius: '9999px',
                padding: '12px 28px',
                fontSize: '15px',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Read Story
            </Link>
          </div>
        </section>
      )}

      {/* WHAT WE COVER */}
      {!isExplorer && (
        <section className="bg-[#EEF4FF]">
          <div className="mx-auto max-w-7xl px-6 py-16">
            <p className="text-center text-xs font-bold uppercase tracking-widest text-teal">What we cover</p>
            <h2 className="mt-2 text-center font-display text-3xl font-bold text-navy md:text-4xl">13 Topics. One World.</h2>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {TOPICS.map((t) => (
                <div key={t.title} className={`rounded-2xl border-l-4 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${t.border}`}>
                  <div className="text-2xl">{t.icon}</div>
                  <h3 className="mt-2 font-display text-lg font-bold text-navy">{t.title}</h3>
                  <p className="mt-1 text-sm text-navy/70">{t.desc}</p>
                  <a href="#" className="mt-3 inline-block text-sm font-bold text-teal hover:underline">Explore →</a>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* HOW IT WORKS */}
      <section className="bg-white">
        <div className={`mx-auto max-w-7xl px-6 ${isExplorer ? 'pt-6 pb-16' : 'py-16'}`}>
          <p className="text-center text-xs font-bold uppercase tracking-widest text-teal">How it works</p>
          <h2 className="mt-2 text-center font-display text-3xl font-bold text-navy md:text-4xl">{howHeadline}</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {howSteps.map((s, i) => (
              <div key={s.title} className="rounded-2xl border border-border bg-white p-7 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl text-white ${s.color}`}>{s.icon}</div>
                <div className="mt-3 text-xs font-bold uppercase text-muted-foreground">Step {i + 1}</div>
                <h3 className="mt-1 font-display text-lg font-bold text-navy">{s.title}</h3>
                <p className="mt-2 text-sm text-navy/70">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AGE GROUPS */}
      {!isExplorer && (
        <section className="bg-[#EEF4FF]">
          <div className="mx-auto max-w-7xl px-6 py-16">
            <p className="text-center text-xs font-bold uppercase tracking-widest text-teal">Built for every age</p>
            <h2 className="mt-2 text-center font-display text-3xl font-bold text-navy md:text-4xl">Same world. Right level.</h2>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {AGES.map((a) => (
                <div key={a.title} className={`rounded-2xl border-2 p-6 transition hover:-translate-y-1 hover:shadow-lg ${a.bg} ${a.border}`}>
                  <div className="text-3xl">{a.emoji}</div>
                  <h3 className="mt-2 font-display text-xl font-bold text-navy">{a.title}</h3>
                  <div className="text-sm font-bold text-navy/70">{a.ages}</div>
                  <ul className="mt-3 space-y-1 text-sm text-navy/80">
                    {a.items.map((item) => <li key={item}>• {item}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* GAMIFICATION */}
      {isExplorer ? (
        <section style={{ background: 'linear-gradient(135deg, #F5A623, #E8941A)', padding: '48px 40px' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
            <p style={{ color: '#FFFFFF', fontSize: '11px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>LEARN. EARN. GROW.</p>
            <h2 style={{ color: '#FFFFFF', fontFamily: "'Playfair Display', serif", fontSize: '32px', fontWeight: 800, textAlign: 'center', marginBottom: '40px' }}>Learning that feels like an adventure!</h2>
            <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center', maxWidth: '200px' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <Star size={28} color="#F5A623" fill="#F5A623" />
                </div>
                <h3 style={{ color: '#FFFFFF', fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>Earn Stars!</h3>
                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', textAlign: 'center' }}>Get a star every time you finish a story!</p>
              </div>
              <div style={{ textAlign: 'center', maxWidth: '200px' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <Rocket size={28} color="#F5A623" fill="#F5A623" />
                </div>
                <h3 style={{ color: '#FFFFFF', fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>Level Up!</h3>
                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', textAlign: 'center' }}>The more you read, the higher you go!</p>
              </div>
              <div style={{ textAlign: 'center', maxWidth: '200px' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <Flame size={28} color="#F5A623" fill="#F5A623" />
                </div>
                <h3 style={{ color: '#FFFFFF', fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>Come Back Every Day!</h3>
                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', textAlign: 'center' }}>Build your streak and win bonus stars!</p>
              </div>
              <div style={{ textAlign: 'center', maxWidth: '200px' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <Award size={28} color="#F5A623" fill="#F5A623" />
                </div>
                <h3 style={{ color: '#FFFFFF', fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>Collect Badges!</h3>
                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', textAlign: 'center' }}>Earn special badges for being amazing!</p>
              </div>
            </div>
            <Link to="/signup" style={{ display: 'inline-block', background: '#FFFFFF', color: '#F5A623', borderRadius: '9999px', padding: '12px 32px', fontSize: '15px', fontWeight: 800, textDecoration: 'none', marginTop: '32px' }}>
              Start Earning Stars!
            </Link>
          </div>
        </section>
      ) : (
        <section className="bg-navy text-white">
          <div className="mx-auto max-w-7xl px-6 py-16">
            <p className="text-center text-xs font-bold uppercase tracking-widest text-gold">Learn. Earn. Grow.</p>
            <h2 className="mt-2 text-center font-display text-3xl font-bold text-white md:text-4xl">Learning that feels like an adventure</h2>
            <div className="mt-10 grid gap-8 md:grid-cols-4">
              {GAMIFY.map((g) => (
                <div key={g.title} className="text-center">
                  <div className="text-4xl">{g.icon}</div>
                  <h3 className="mt-3 font-display text-lg font-bold text-gold">{g.title}</h3>
                  <p className="mt-2 text-sm text-white/75">{g.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TODAY'S TOP STORIES */}
      <section className={cfg.storiesBg ?? 'bg-[#EEF4FF]'}>
        <div className="mx-auto max-w-7xl px-6 py-16">
          <p className={`text-center text-xs font-bold uppercase tracking-widest ${cfg.sectionLabelCls ?? 'text-teal'}`}>{cfg.storiesLabel}</p>
          <h2 className={`mt-2 text-center font-display text-3xl font-bold md:text-4xl ${cfg.sectionHeadlineCls ?? 'text-navy'}`}>{cfg.storiesHeadline}</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {STORIES.map((st, i) => (
              <article key={i} className={`group flex flex-col rounded-2xl shadow-sm transition hover:-translate-y-1 hover:shadow-lg overflow-hidden ${cfg.storyCardCls ?? 'bg-white'}`}>
                {isExplorer && (
                  <img
                    src={EXPLORER_CARD_IMG}
                    alt=""
                    className="w-full"
                    style={{ height: '120px', objectFit: 'cover', borderRadius: '12px 12px 0 0' }}
                  />
                )}
                <div className="flex flex-1 flex-col p-5">
                  <span className={`inline-flex w-fit rounded-full px-3 py-1 text-[11px] font-bold ${st.tag}`}>{st.cat}</span>
                  {isExplorer ? (
                    <h3 className="mt-3" style={{ fontSize: '16px', fontWeight: 700, color: '#1B2F5E', lineHeight: 1.4 }}>{st.title}</h3>
                  ) : (
                    <h3 className={`mt-3 font-display text-lg font-bold ${isThinker ? 'text-white' : 'text-navy'}`}>{st.title}</h3>
                  )}
                  <div className={`mt-auto flex items-center justify-between pt-4 text-xs font-bold ${isThinker ? 'text-white/70' : 'text-muted-foreground'}`}>
                    <span>{isExplorer ? '⏱ 3 min read' : cfg.storyMeta}</span>
                    <span className={isThinker ? 'text-gold' : 'text-gold-dark'}>{cfg.storyXp}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* THREE INSIGHT CARDS */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-16 md:grid-cols-3">
          <div className="rounded-2xl border-t-4 border-teal bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-teal">☪️ What Islam Teaches</p>
            <h3 className="mt-2 font-display text-xl font-bold text-navy">Seek Knowledge</h3>
            <p className="mt-3 text-right font-arabic text-base text-navy" dir="rtl">طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ</p>
            <p className="mt-2 text-sm italic text-navy/70">&quot;Seeking knowledge is an obligation upon every Muslim.&quot; — Ibn Majah</p>
            <a href="#" className="mt-4 inline-block text-sm font-bold text-teal hover:underline">Read More →</a>
          </div>
          <div className="rounded-2xl border-t-4 border-gold bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-gold-dark">💡 Think About It</p>
            <p className="mt-3 text-base italic text-navy">&quot;If knowledge is a duty, how can I spend even one day without learning something new?&quot;</p>
            <button type="button" className="mt-5 rounded-full bg-gold px-5 py-2.5 text-sm font-bold text-navy hover:bg-gold-dark hover:text-white">Share Your Thoughts</button>
          </div>
          <div className="rounded-2xl border-t-4 border-purple bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-purple-dark">🎨 Activity Corner</p>
            <h3 className="mt-2 font-display text-xl font-bold text-navy">Build Your Own News Page</h3>
            <p className="mt-2 text-sm text-navy/70">Pick a story, write 3 sentences, and draw what it means to you.</p>
            <button type="button" className="mt-5 rounded-full border border-purple px-5 py-2.5 text-sm font-bold text-purple-dark hover:bg-purple hover:text-white">Unlock with Family Plan</button>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="bg-[#EEF4FF]">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-teal">Simple pricing</p>
          <h2 className="mt-2 text-center font-display text-3xl font-bold text-navy md:text-4xl">One family. One price.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-navy/70">No per-child fees. One subscription covers your whole family up to 3 children.</p>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {PRICING.map((p) => (
              <div key={p.name} className={`flex flex-col rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${p.border}`}>
                <span className={`inline-flex w-fit rounded-full px-3 py-1 text-[10px] font-extrabold tracking-wider ${p.noteCls}`}>{p.note}</span>
                <h3 className="mt-3 font-display text-xl font-bold text-navy">{p.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-display text-3xl font-bold text-navy">{p.price}</span>
                  {'per' in p && p.per && <span className="text-sm text-navy/60">{p.per}</span>}
                </div>
                <ul className="mt-4 flex-1 space-y-2 text-sm text-navy/80">
                  {p.features.map((f) => <li key={f}>{f}</li>)}
                </ul>
                <Link to="/signup" className={`mt-5 inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-bold transition ${p.ctaCls}`}>{p.cta}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BAND */}
      <section className="bg-gold">
        <div className="mx-auto max-w-5xl px-6 py-14 text-center">
          <h2 className="font-display text-2xl font-bold text-navy md:text-[28px]">Start your child&apos;s learning journey today</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-navy/80">Join the growing community of Muslim families raising aware, grounded children.</p>
          <Link to="/signup" className="mt-6 inline-flex rounded-full bg-navy px-7 py-3 text-sm font-extrabold text-white shadow-md transition hover:bg-navy-deep">
            Get Started Free →
          </Link>
          <p className="mt-3 text-xs text-navy/70">Free forever · Cancel anytime · EN, FR, AR</p>
        </div>
      </section>

      <SiteFooter variant="light" />
    </div>
  )
}
