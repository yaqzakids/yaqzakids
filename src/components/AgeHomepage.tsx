import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { SiteFooter } from '@/components/SiteFooter'
import { Star, Rocket, Flame, Award } from 'lucide-react'
import { useT } from '@/i18n'
import type { TranslationKeys } from '@/i18n/locales/en'

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

type AgeHomepageProps = Partial<Omit<AgeHomepageConfig, 'variant'>> &
  Pick<AgeHomepageConfig, 'variant'> & {
    afterHero?: ReactNode
  }

const EXPLORER_HERO =
  'https://i.ibb.co/bj7FdD4Z/Chat-GPT-Image-Jun-3-2026-11-34-07-PM.png'
const EXPLORER_CARD_IMG = 'https://i.ibb.co/8DbgpyNZ/Jun-2-2026-11-10-16-PM.png'

function buildExplorerConfig(t: TranslationKeys): AgeHomepageConfig {
  return {
    variant: 'explorer',
    pageBg: 'bg-cream',
    heroBg: EXPLORER_HERO,
    heroOverlay:
      'linear-gradient(to right, rgba(255,251,240,0.97) 0%, rgba(255,251,240,0.92) 40%, transparent 100%)',
    pillText: t.explorer.pillText,
    headlineParts: [
      { text: t.explorer.headline1, color: 'text-navy' },
      { text: t.explorer.headline2, color: 'text-gold' },
      { text: t.explorer.headline3, color: 'text-navy' },
    ],
    subtitle: t.explorer.subtitle,
    primaryCta: { label: t.explorer.primaryCta, cls: 'bg-gold text-white hover:bg-gold-dark' },
    secondaryCta: {
      label: t.explorer.secondaryCta,
      cls: 'border-2 border-gold text-gold-dark hover:bg-gold hover:text-white',
    },
    trustText: t.explorer.trustText,
    features: [
      { icon: '📖', title: t.explorer.featureStories },
      { icon: '🎨', title: t.explorer.featureActivities },
      { icon: '⭐', title: t.explorer.featureStars },
      { icon: '☪️', title: t.explorer.featureIslam },
    ],
    storiesLabel: t.explorer.storiesLabel,
    storiesHeadline: t.explorer.storiesHeadline,
    storyXp: t.explorer.storyXp,
    storyMeta: 'Easy · 3 min',
  }
}

export function AgeHomepage(props: AgeHomepageProps) {
  const t = useT()
  const { afterHero, ...restProps } = props
  const explorerDefaults = props.variant === 'explorer' ? buildExplorerConfig(t) : null
  const cfg = { ...explorerDefaults, ...restProps } as AgeHomepageConfig

  const isThinker = cfg.variant === 'thinker'
  const isExplorer = cfg.variant === 'explorer'
  const ah = t.ageHomepage
  const ex = t.explorer

  const topics = [
    { icon: '📰', title: ah.topicWorldNews, desc: ah.topicWorldNewsDesc, border: 'border-l-navy' },
    { icon: '🔬', title: ah.topicScience, desc: ah.topicScienceDesc, border: 'border-l-teal' },
    { icon: '🏛️', title: ah.topicHistory, desc: ah.topicHistoryDesc, border: 'border-l-gold' },
    { icon: '🤖', title: ah.topicTech, desc: ah.topicTechDesc, border: 'border-l-purple' },
    { icon: '🌱', title: ah.topicEnvironment, desc: ah.topicEnvironmentDesc, border: 'border-l-[#4AAE8A]' },
    { icon: '🧭', title: ah.topicGeography, desc: ah.topicGeographyDesc, border: 'border-l-coral' },
  ]

  const howSteps = isExplorer
    ? [
        { icon: '👤', color: 'bg-gold', title: ex.howStep1Title, desc: ex.howStep1Desc },
        { icon: '📖', color: 'bg-teal', title: ex.howStep2Title, desc: ex.howStep2Desc },
        { icon: '⭐', color: 'bg-purple', title: ex.howStep3Title, desc: ex.howStep3Desc },
      ]
    : [
        { icon: '👤', color: 'bg-teal', title: ah.howStep1Title, desc: ah.howStep1Desc },
        { icon: '📰', color: 'bg-gold', title: ah.howStep2Title, desc: ah.howStep2Desc },
        { icon: '🌙', color: 'bg-purple', title: ah.howStep3Title, desc: ah.howStep3Desc },
      ]

  const howHeadline = isExplorer ? ex.howHeadline : ah.howHeadlineDefault
  const howLabel = isExplorer ? ex.howLabel : ah.howLabel
  const stepLabel = isExplorer ? ex.stepLabel : ah.stepLabel

  const ages = [
    {
      emoji: '🌱',
      title: ah.ageExplorer,
      ages: ah.ageExplorerAges,
      bg: 'bg-[#E8F5EE]',
      border: 'border-[#4AAE8A]',
      items: [ah.ageExplorerItem1, ah.ageExplorerItem2, ah.ageExplorerItem3],
    },
    {
      emoji: '🔍',
      title: ah.ageDiscoverer,
      ages: ah.ageDiscovererAges,
      bg: 'bg-[#FDE8B8]',
      border: 'border-[#E8A020]',
      items: [ah.ageDiscovererItem1, ah.ageDiscovererItem2, ah.ageDiscovererItem3],
    },
    {
      emoji: '🌍',
      title: ah.ageThinker,
      ages: ah.ageThinkerAges,
      bg: 'bg-[#EDE9FE]',
      border: 'border-[#8B6BB1]',
      items: [ah.ageThinkerItem1, ah.ageThinkerItem2, ah.ageThinkerItem3],
    },
  ]

  const gamify = [
    { icon: '⚡', title: ah.gamifyXpTitle, desc: ah.gamifyXpDesc },
    { icon: '🏆', title: ah.gamifyLevelTitle, desc: ah.gamifyLevelDesc },
    { icon: '🔥', title: ah.gamifyStreakTitle, desc: ah.gamifyStreakDesc },
    { icon: '🎖️', title: ah.gamifyBadgesTitle, desc: ah.gamifyBadgesDesc },
  ]

  const stories = [
    { cat: ah.catWorldNews, tag: 'bg-navy text-white', title: ah.story1Title },
    { cat: ah.catScience, tag: 'bg-teal text-white', title: ah.story2Title },
    { cat: ah.catHistory, tag: 'bg-gold text-navy', title: ah.story3Title },
    { cat: ah.catTechnology, tag: 'bg-purple text-white', title: ah.story4Title },
    { cat: ah.catEnvironment, tag: 'bg-[#4AAE8A] text-white', title: ah.story5Title },
    { cat: ah.catGeography, tag: 'bg-coral text-white', title: ah.story6Title },
  ]

  const pricing = [
    {
      name: ah.planFree,
      price: '$0',
      note: ah.planFreeNote,
      noteCls: 'bg-teal/10 text-teal',
      border: 'border-border',
      features: [ah.planFeatArticles5, ah.planFeatLanguages, ah.planFeatNoArchive, ah.planFeatNoWorksheets, ah.planFeatNoInsights],
      cta: ah.planCtaFree,
      ctaCls: 'border border-navy/30 text-navy hover:bg-navy hover:text-white',
    },
    {
      name: ah.planMonthly,
      price: '$9.99',
      per: ah.perMonth,
      note: ah.planMonthlyNote,
      noteCls: 'bg-gold text-navy',
      border: 'border-2 border-gold',
      features: [ah.planFeatDaily, ah.planFeatLanguages, ah.planFeatArchive, ah.planFeatWorksheets, ah.planFeatInsights],
      cta: ah.planCtaMonthly,
      ctaCls: 'bg-gold text-navy hover:bg-gold-dark hover:text-white',
    },
    {
      name: ah.planYearly,
      price: '$79.99',
      per: ah.perYear,
      note: ah.planYearlyNote,
      noteCls: 'bg-teal text-white',
      border: 'border-border',
      features: [ah.planFeatSave, ah.planFeatAllIncluded, ah.planFeatArchive, ah.planFeatWorksheets, ah.planFeatInsights],
      cta: ah.planCtaYearly,
      ctaCls: 'border border-navy/30 text-navy hover:bg-navy hover:text-white',
    },
    {
      name: ah.planSchool,
      price: '$299',
      per: ah.perYear,
      note: ah.planSchoolNote,
      noteCls: 'bg-purple text-white',
      border: 'border-border',
      features: [ah.planFeatStudents, ah.planFeatTeacher, ah.planFeatAllFeatures, ah.planFeatReports, ah.planFeatSupport],
      cta: ah.planCtaSchool,
      ctaCls: 'border border-navy/30 text-navy hover:bg-navy hover:text-white',
    },
  ]

  return (
    <div className={cfg.pageBg ?? 'bg-white'}>
      <section
        className="relative min-h-[580px] w-full"
        style={{ backgroundImage: `url(${cfg.heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center right' }}
      >
        <div className="absolute inset-0" style={{ background: cfg.heroOverlay }} />
        <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-12 md:pt-20">
          <div className="max-w-[520px]">
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${
                isThinker ? 'border-white/40 text-white' : 'border-navy/40 text-navy'
              }`}
            >
              {cfg.pillText}
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-tight md:text-[54px] md:leading-[1.05]">
              {cfg.headlineParts.map((p, i) => (
                <span key={i} className={p.color}>
                  {p.text}
                  {i < cfg.headlineParts.length - 1 ? ' ' : ''}
                </span>
              ))}
            </h1>
            <p className={`mt-5 text-base md:text-[17px] ${cfg.subtitleColor ?? 'text-[#374151]'}`}>{cfg.subtitle}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/signup" className={`rounded-full px-6 py-3 text-sm font-extrabold shadow-md transition ${cfg.primaryCta.cls}`}>
                {cfg.primaryCta.label}
              </Link>
              <Link to="/discoverer" className={`rounded-full px-6 py-3 text-sm font-extrabold transition ${cfg.secondaryCta.cls}`}>
                {cfg.secondaryCta.label}
              </Link>
            </div>
            <p className={`mt-6 text-xs ${isThinker ? 'text-white/70' : 'text-navy/70'}`}>{cfg.trustText}</p>
          </div>
        </div>
      </section>

      {afterHero}

      {cfg.features && cfg.features.length > 0 && (
        <section className={cfg.featureStripCls ?? 'bg-white border-b border-border'}>
          <div className="mx-auto max-w-7xl px-6 py-5">
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
              {cfg.features.map((f) => (
                <div key={f.title} className="flex items-center gap-2">
                  <span className="text-2xl">{f.icon}</span>
                  <span className={`text-sm font-bold ${cfg.variant === 'thinker' ? 'text-white' : 'text-navy'}`}>
                    {f.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {isExplorer && (
        <section style={{ position: 'relative', width: '100%' }}>
          <img
            src="https://i.ibb.co/Z12Kh7qv/Chat-GPT-Image-Jun-4-2026-05-37-16-PM.png"
            alt=""
            style={{ display: 'block', width: '100%', height: 'auto' }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to right, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.5) 40%, transparent 100%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              padding: '48px 60px 48px 96px',
            }}
          >
            <div style={{ maxWidth: '556px' }}>
              <div style={{ color: '#F5A623', fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>
                {ex.featuredLabel}
              </div>
              <h2
                style={{
                  color: '#FFFFFF',
                  fontFamily: "'Playfair Display', serif",
                  fontSize: '36px',
                  fontWeight: 800,
                  lineHeight: 1.2,
                  marginBottom: '14px',
                }}
              >
                {ex.featuredTitle}
              </h2>
              <p
                style={{
                  color: 'rgba(255,255,255,0.85)',
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: '16px',
                  lineHeight: 1.7,
                  marginBottom: '24px',
                }}
              >
                {ex.featuredDesc}
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
                {ex.featuredCta}
              </Link>
            </div>
          </div>
        </section>
      )}

      {!isExplorer && (
        <section className="bg-[#EEF4FF]">
          <div className="mx-auto max-w-7xl px-6 py-16">
            <p className="text-center text-xs font-bold uppercase tracking-widest text-teal">{ah.whatWeCover}</p>
            <h2 className="mt-2 text-center font-display text-3xl font-bold text-navy md:text-4xl">{ah.topicsHeadline}</h2>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {topics.map((topic) => (
                <div
                  key={topic.title}
                  className={`rounded-2xl border-l-4 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${topic.border}`}
                >
                  <div className="text-2xl">{topic.icon}</div>
                  <h3 className="mt-2 font-display text-lg font-bold text-navy">{topic.title}</h3>
                  <p className="mt-1 text-sm text-navy/70">{topic.desc}</p>
                  <a href="#" className="mt-3 inline-block text-sm font-bold text-teal hover:underline">
                    {ah.exploreLink}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-white">
        <div className={`mx-auto max-w-7xl px-6 ${isExplorer ? 'pt-6 pb-16' : 'py-16'}`}>
          <p className="text-center text-xs font-bold uppercase tracking-widest text-teal">{howLabel}</p>
          <h2 className="mt-2 text-center font-display text-3xl font-bold text-navy md:text-4xl">{howHeadline}</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {howSteps.map((s, i) => (
              <div
                key={s.title}
                className="rounded-2xl border border-border bg-white p-7 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl text-white ${s.color}`}>
                  {s.icon}
                </div>
                <div className="mt-3 text-xs font-bold uppercase text-muted-foreground">
                  {stepLabel} {i + 1}
                </div>
                <h3 className="mt-1 font-display text-lg font-bold text-navy">{s.title}</h3>
                <p className="mt-2 text-sm text-navy/70">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {!isExplorer && (
        <section className="bg-[#EEF4FF]">
          <div className="mx-auto max-w-7xl px-6 py-16">
            <p className="text-center text-xs font-bold uppercase tracking-widest text-teal">{ah.agesLabel}</p>
            <h2 className="mt-2 text-center font-display text-3xl font-bold text-navy md:text-4xl">{ah.agesHeadline}</h2>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {ages.map((a) => (
                <div key={a.title} className={`rounded-2xl border-2 p-6 transition hover:-translate-y-1 hover:shadow-lg ${a.bg} ${a.border}`}>
                  <div className="text-3xl">{a.emoji}</div>
                  <h3 className="mt-2 font-display text-xl font-bold text-navy">{a.title}</h3>
                  <div className="text-sm font-bold text-navy/70">{a.ages}</div>
                  <ul className="mt-3 space-y-1 text-sm text-navy/80">
                    {a.items.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {isExplorer ? (
        <section style={{ background: 'linear-gradient(135deg, #F5A623, #E8941A)', padding: '48px 40px' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
            <p
              style={{
                color: '#FFFFFF',
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                marginBottom: '8px',
              }}
            >
              {ex.gamifyLabel}
            </p>
            <h2
              style={{
                color: '#FFFFFF',
                fontFamily: "'Playfair Display', serif",
                fontSize: '32px',
                fontWeight: 800,
                textAlign: 'center',
                marginBottom: '40px',
              }}
            >
              {ex.gamifyHeadline}
            </h2>
            <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {[
                { Icon: Star, title: ex.gamifyStarsTitle, desc: ex.gamifyStarsDesc },
                { Icon: Rocket, title: ex.gamifyLevelTitle, desc: ex.gamifyLevelDesc },
                { Icon: Flame, title: ex.gamifyStreakTitle, desc: ex.gamifyStreakDesc },
                { Icon: Award, title: ex.gamifyBadgesTitle, desc: ex.gamifyBadgesDesc },
              ].map(({ Icon, title, desc }) => (
                <div key={title} style={{ textAlign: 'center', maxWidth: '200px' }}>
                  <div
                    style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: '50%',
                      background: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 14px',
                    }}
                  >
                    <Icon size={28} color="#F5A623" fill="#F5A623" />
                  </div>
                  <h3 style={{ color: '#FFFFFF', fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>{title}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', textAlign: 'center' }}>{desc}</p>
                </div>
              ))}
            </div>
            <Link
              to="/signup"
              style={{
                display: 'inline-block',
                background: '#FFFFFF',
                color: '#F5A623',
                borderRadius: '9999px',
                padding: '12px 32px',
                fontSize: '15px',
                fontWeight: 800,
                textDecoration: 'none',
                marginTop: '32px',
              }}
            >
              {ex.gamifyCta}
            </Link>
          </div>
        </section>
      ) : (
        <section className="bg-navy text-white">
          <div className="mx-auto max-w-7xl px-6 py-16">
            <p className="text-center text-xs font-bold uppercase tracking-widest text-gold">{ah.gamifyLabel}</p>
            <h2 className="mt-2 text-center font-display text-3xl font-bold text-white md:text-4xl">{ah.gamifyHeadline}</h2>
            <div className="mt-10 grid gap-8 md:grid-cols-4">
              {gamify.map((g) => (
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

      <section className={cfg.storiesBg ?? 'bg-[#EEF4FF]'}>
        <div className="mx-auto max-w-7xl px-6 py-16">
          <p className={`text-center text-xs font-bold uppercase tracking-widest ${cfg.sectionLabelCls ?? 'text-teal'}`}>
            {cfg.storiesLabel}
          </p>
          <h2 className={`mt-2 text-center font-display text-3xl font-bold md:text-4xl ${cfg.sectionHeadlineCls ?? 'text-navy'}`}>
            {cfg.storiesHeadline}
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {stories.map((st, i) => (
              <article
                key={i}
                className={`group flex flex-col rounded-2xl shadow-sm transition hover:-translate-y-1 hover:shadow-lg overflow-hidden ${cfg.storyCardCls ?? 'bg-white'}`}
              >
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
                    <h3 className="mt-3" style={{ fontSize: '16px', fontWeight: 700, color: '#1B2F5E', lineHeight: 1.4 }}>
                      {st.title}
                    </h3>
                  ) : (
                    <h3 className={`mt-3 font-display text-lg font-bold ${isThinker ? 'text-white' : 'text-navy'}`}>{st.title}</h3>
                  )}
                  <div
                    className={`mt-auto flex items-center justify-between pt-4 text-xs font-bold ${isThinker ? 'text-white/70' : 'text-muted-foreground'}`}
                  >
                    <span>{isExplorer ? ex.storyReadTime : cfg.storyMeta}</span>
                    <span className={isThinker ? 'text-gold' : 'text-gold-dark'}>{cfg.storyXp}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-16 md:grid-cols-3">
          <div className="rounded-2xl border-t-4 border-teal bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-teal">{ah.islamTeaches}</p>
            <h3 className="mt-2 font-display text-xl font-bold text-navy">{ah.islamTeachesTitle}</h3>
            <p className="mt-3 text-right font-arabic text-base text-navy" dir="rtl">
              طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ
            </p>
            <p className="mt-2 text-sm italic text-navy/70">{ah.islamTeachesQuote}</p>
            <a href="#" className="mt-4 inline-block text-sm font-bold text-teal hover:underline">
              {ah.readMore}
            </a>
          </div>
          <div className="rounded-2xl border-t-4 border-gold bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-gold-dark">{ah.thinkAboutIt}</p>
            <p className="mt-3 text-base italic text-navy">{ah.thinkAboutItQuote}</p>
            <button type="button" className="mt-5 rounded-full bg-gold px-5 py-2.5 text-sm font-bold text-navy hover:bg-gold-dark hover:text-white">
              {ah.shareThoughts}
            </button>
          </div>
          <div className="rounded-2xl border-t-4 border-purple bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-purple-dark">{ah.activityCorner}</p>
            <h3 className="mt-2 font-display text-xl font-bold text-navy">{ah.activityTitle}</h3>
            <p className="mt-2 text-sm text-navy/70">{ah.activityDesc}</p>
            <button
              type="button"
              className="mt-5 rounded-full border border-purple px-5 py-2.5 text-sm font-bold text-purple-dark hover:bg-purple hover:text-white"
            >
              {ah.unlockFamily}
            </button>
          </div>
        </div>
      </section>

      <section className="bg-[#EEF4FF]">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-teal">{ah.pricingLabel}</p>
          <h2 className="mt-2 text-center font-display text-3xl font-bold text-navy md:text-4xl">{ah.pricingHeadline}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-navy/70">{ah.pricingSub}</p>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {pricing.map((p) => (
              <div key={p.name} className={`flex flex-col rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${p.border}`}>
                <span className={`inline-flex w-fit rounded-full px-3 py-1 text-[10px] font-extrabold tracking-wider ${p.noteCls}`}>
                  {p.note}
                </span>
                <h3 className="mt-3 font-display text-xl font-bold text-navy">{p.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-display text-3xl font-bold text-navy">{p.price}</span>
                  {'per' in p && p.per && <span className="text-sm text-navy/60">{p.per}</span>}
                </div>
                <ul className="mt-4 flex-1 space-y-2 text-sm text-navy/80">
                  {p.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <Link to="/signup" className={`mt-5 inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-bold transition ${p.ctaCls}`}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gold">
        <div className="mx-auto max-w-5xl px-6 py-14 text-center">
          <h2 className="font-display text-2xl font-bold text-navy md:text-[28px]">{ah.ctaHeadline}</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-navy/80">{ah.ctaSub}</p>
          <Link to="/signup" className="mt-6 inline-flex rounded-full bg-navy px-7 py-3 text-sm font-extrabold text-white shadow-md transition hover:bg-navy-deep">
            {ah.ctaButton}
          </Link>
          <p className="mt-3 text-xs text-navy/70">{ah.ctaFootnote}</p>
        </div>
      </section>

      <SiteFooter variant="light" />
    </div>
  )
}
