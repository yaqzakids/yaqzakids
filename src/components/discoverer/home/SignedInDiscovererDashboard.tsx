import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import TealProgressBar from '@/components/discoverer/TealProgressBar'
import BadgeHexagon from '@/components/discoverer/BadgeHexagon'
import { DISCOVERER_HERO_IMAGE } from '@/components/discoverer/DiscovererHeroShell'
import LearningPathsSection from '@/components/learningPaths/LearningPathsSection'
import { STAR_LEVELS } from '@/lib/adventure/levels'
import {
  DISCOVERER_BADGE_DISPLAY,
  LEARNING_PATHS_HOME,
  matchPathForCategory,
  resolveArticleUrl,
  type DiscovererBadgeDisplay,
  type LastUnfinishedArticle,
} from '@/lib/discoverer'
import { SIGNED_IN_RECOMMENDED, type DiscovererStoryCard } from '@/lib/discovererHomeContent'
import type { AdventureArticle } from '@/lib/adventure/types'
import { learningPathDetailUrl } from '@/lib/learningPaths'
import type { PathWithProgress } from '@/lib/adventure/types'

export interface SignedInDiscovererDashboardProps {
  childName: string
  levelNumber: number
  levelName: string
  xp: number
  stars: number
  streak: number
  missionDone: { read: boolean; quiz: boolean; reflection: boolean }
  lastArticle: LastUnfinishedArticle | null
  activePath: PathWithProgress | null
  pathLabel: string | null
  allPaths: PathWithProgress[]
  recommendedArticles: AdventureArticle[]
  earnedBadgeSlugs: Set<string>
  onBadgeClick?: (badge: DiscovererBadgeDisplay) => void
}

function xpBounds(totalStars: number) {
  let idx = 0
  for (let i = 0; i < STAR_LEVELS.length; i++) {
    if (totalStars >= STAR_LEVELS[i].min) idx = i
  }
  const currentMin = STAR_LEVELS[idx].min
  const nextMin = STAR_LEVELS[idx + 1]?.min ?? totalStars
  return { currentMin, nextMin, xpInLevel: totalStars - currentMin, xpNeeded: nextMin - currentMin }
}

function DashboardCard({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-[0_4px_20px_rgba(27,47,94,0.08)] border border-white/80 p-4 md:p-5 ${className}`}
    >
      {children}
    </div>
  )
}

function RecommendedStrip({
  articles,
  fallbackCards,
}: {
  articles: AdventureArticle[]
  fallbackCards: DiscovererStoryCard[]
}) {
  const [cards, setCards] = useState<DiscovererStoryCard[]>(fallbackCards.slice(0, 3))

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (articles.length === 0) {
        setCards(fallbackCards.slice(0, 3))
        return
      }
      const resolved = await Promise.all(
        articles.slice(0, 3).map(async (a) => ({
          title: a.title,
          category: 'For You',
          description: a.excerpt ?? '',
          image:
            a.cover_image_url ??
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
          readingTime: a.reading_time_minutes,
          ageTag: '',
          starsReward: 15,
          url: (await resolveArticleUrl(a.id)) ?? '/discoverer/explore',
        }))
      )
      if (!cancelled) setCards(resolved)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [articles, fallbackCards])

  return (
    <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory">
      {cards.map((card) => (
        <Link
          key={card.title}
          to={card.url}
          className="snap-start shrink-0 w-[140px] bg-[#F7FAFF] rounded-xl overflow-hidden border border-[#E2EBF8] hover:shadow-md transition-shadow"
        >
          <img src={card.image} alt="" className="w-full h-24 object-cover" />
          <p className="px-2 py-2 text-[11px] font-bold text-[#1B2F5E] line-clamp-2 leading-snug">
            {card.title}
          </p>
        </Link>
      ))}
    </div>
  )
}

export default function SignedInDiscovererDashboard({
  childName,
  levelNumber,
  levelName,
  xp,
  stars,
  streak,
  missionDone,
  lastArticle,
  activePath,
  pathLabel,
  allPaths,
  recommendedArticles,
  earnedBadgeSlugs,
  onBadgeClick,
}: SignedInDiscovererDashboardProps) {
  const { xpInLevel, xpNeeded } = xpBounds(xp)

  const continueTitle =
    lastArticle?.title ?? activePath?.nextArticleTitle ?? activePath?.title ?? 'Start your adventure'
  const continueUrl =
    lastArticle?.url ?? (activePath ? learningPathDetailUrl(activePath.slug) : '/paths')
  const continuePct = activePath?.path_progress?.completion_percentage ?? 0
  const continueImage =
    activePath?.cover_image_url ??
    'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&q=80'

  const pathRows = useMemo(() => {
    return LEARNING_PATHS_HOME.map((category) => {
      const live = matchPathForCategory(category, allPaths)
      const pct = live?.path_progress?.completion_percentage ?? 0
      return { category, live, pct }
    })
      .filter((row) => row.pct > 0)
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 5)
  }, [allPaths])

  const displayBadges = DISCOVERER_BADGE_DISPLAY.slice(0, 3)

  return (
    <div className="pt-6 pb-4 space-y-5">
      {/* Hero banner */}
      <section className="rounded-3xl overflow-hidden bg-gradient-to-br from-[#B8DCE8] via-[#D4EBF5] to-[#EEF4FF] shadow-[0_8px_32px_rgba(27,47,94,0.1)]">
        <div className="grid lg:grid-cols-[1fr_340px] items-stretch">
          <div className="p-6 md:p-8 flex flex-col justify-center">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-[#1B2F5E] mb-2">
              Welcome back, {childName}! 👋
            </h1>
            <p className="text-[#1B2F5E]/75 font-semibold mb-5">
              You&apos;re on an amazing learning adventure!
            </p>
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full bg-[#1B2F5E] text-white text-xs font-extrabold">
                Level {levelNumber}
              </span>
              <span className="text-sm font-bold text-[#1B2F5E]">{levelName}</span>
            </div>
            <div className="max-w-md">
              <div className="flex justify-between text-xs font-bold text-[#1B2F5E]/70 mb-1.5">
                <span>
                  {xpInLevel} / {xpNeeded} XP
                </span>
              </div>
              <div className="h-3 bg-white/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2AAFA0] rounded-full transition-all"
                  style={{ width: `${xpNeeded > 0 ? Math.min(100, (xpInLevel / xpNeeded) * 100) : 100}%` }}
                />
              </div>
            </div>
          </div>
          <div className="hidden lg:block relative min-h-[220px]">
            <img
              src={DISCOVERER_HERO_IMAGE}
              alt=""
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#D4EBF5] to-transparent" aria-hidden />
          </div>
        </div>
      </section>

      <LearningPathsSection isSignedIn ageGroup="discoverer" allPaths={allPaths} />

      {/* Stats row */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <DashboardCard className="sm:col-span-2 xl:col-span-1">
          <div className="flex items-start justify-between gap-2 mb-3">
            <p className="font-bold text-[#1B2F5E]">Daily Mission</p>
            <Link to="/discoverer/mission" className="text-[#2AAFA0] text-xs font-extrabold">
              Go →
            </Link>
          </div>
          <ul className="space-y-2 text-sm font-semibold text-[#1B2F5E] mb-3">
            <li className="flex items-center gap-2">
              <span className={missionDone.read ? 'text-[#2AAFA0]' : 'text-[#9CA3AF]'}>
                {missionDone.read ? '✓' : '○'}
              </span>
              Read 1 story
            </li>
            <li className="flex items-center gap-2">
              <span className={missionDone.quiz ? 'text-[#2AAFA0]' : 'text-[#9CA3AF]'}>
                {missionDone.quiz ? '✓' : '○'}
              </span>
              Pass 1 quiz
            </li>
            <li className="flex items-center gap-2">
              <span className={missionDone.reflection ? 'text-[#2AAFA0]' : 'text-[#9CA3AF]'}>
                {missionDone.reflection ? '✓' : '○'}
              </span>
              Answer 1 reflection
            </li>
          </ul>
          <p className="text-xs font-bold text-[#F5A623]">🎁 +10 ⭐ when you finish!</p>
        </DashboardCard>

        <DashboardCard className="text-center">
          <p className="text-xs font-extrabold text-[#6B7280] uppercase tracking-wide mb-1">
            Current Streak
          </p>
          <p className="text-4xl font-extrabold text-[#D4820A] mb-0.5">{streak}</p>
          <p className="text-sm font-bold text-[#6B7280]">days 🔥</p>
        </DashboardCard>

        <DashboardCard className="text-center">
          <p className="text-xs font-extrabold text-[#6B7280] uppercase tracking-wide mb-1">
            Stars Earned
          </p>
          <p className="text-4xl font-extrabold text-[#F5A623] mb-0.5">{stars.toLocaleString()}</p>
          <p className="text-lg" aria-hidden>
            ⭐
          </p>
        </DashboardCard>

        <DashboardCard>
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-[#1B2F5E]">My Badges</p>
            <Link to="/discoverer/badges" className="text-[#2AAFA0] text-xs font-extrabold">
              View all
            </Link>
          </div>
          <div className="flex justify-center gap-2">
            {displayBadges.map((b) =>
              onBadgeClick ? (
                <button
                  key={b.slug}
                  type="button"
                  onClick={() => onBadgeClick(b)}
                  className="bg-transparent border-0 p-0 cursor-pointer"
                >
                  <BadgeHexagon
                    icon={b.icon}
                    name={b.name}
                    color={b.color}
                    earned={earnedBadgeSlugs.has(b.slug)}
                    size="sm"
                  />
                </button>
              ) : (
                <Link key={b.slug} to="/discoverer/badges">
                  <BadgeHexagon
                    icon={b.icon}
                    name={b.name}
                    color={b.color}
                    earned={earnedBadgeSlugs.has(b.slug)}
                    size="sm"
                  />
                </Link>
              )
            )}
          </div>
        </DashboardCard>
      </div>

      {/* Continue · Paths · Recommended */}
      <div className="grid lg:grid-cols-12 gap-4">
        <DashboardCard className="lg:col-span-5 overflow-hidden p-0">
          <div className="p-4 md:p-5">
            <p className="font-bold text-[#1B2F5E] mb-3">Continue Learning</p>
            <Link to={continueUrl} className="block group">
              <div className="rounded-xl overflow-hidden mb-3">
                <img
                  src={continueImage}
                  alt=""
                  className="w-full h-36 object-cover group-hover:scale-[1.02] transition-transform"
                />
              </div>
              <p className="text-[10px] font-extrabold text-[#2AAFA0] uppercase mb-1">
                {pathLabel ?? 'Learning Path'}
              </p>
              <p className="font-bold text-[#1B2F5E] text-lg mb-2 line-clamp-2">{continueTitle}</p>
              <TealProgressBar value={continuePct} showLabel className="mb-3" />
              <span className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#2AAFA0] text-white rounded-full text-sm font-extrabold">
                ✨ Continue
              </span>
            </Link>
          </div>
        </DashboardCard>

        <DashboardCard className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <p className="font-bold text-[#1B2F5E]">My Learning Paths</p>
            <Link to="/adventures" className="text-[#2AAFA0] text-xs font-extrabold">
              View all
            </Link>
          </div>
          {pathRows.length === 0 ? (
            <p className="text-sm text-[#6B7280]">Start a path to track progress here.</p>
          ) : (
            <ul className="space-y-3">
              {pathRows.map(({ category, live, pct }) => (
                <li key={category.slug}>
                  <Link to={learningPathDetailUrl(live?.slug ?? category.slug)} className="block group">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg" aria-hidden>
                        {category.emoji}
                      </span>
                      <span className="text-xs font-bold text-[#1B2F5E] group-hover:text-[#2AAFA0] truncate">
                        {category.name}
                      </span>
                      <span className="ml-auto text-[10px] font-extrabold text-[#F5A623]">{pct}%</span>
                    </div>
                    <TealProgressBar value={pct} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>

        <DashboardCard className="lg:col-span-4">
          <div className="flex items-center justify-between mb-4">
            <p className="font-bold text-[#1B2F5E]">Recommended For You</p>
            <Link to="/discoverer/explore" className="text-[#2AAFA0] text-xs font-extrabold">
              →
            </Link>
          </div>
          <RecommendedStrip articles={recommendedArticles} fallbackCards={SIGNED_IN_RECOMMENDED} />
        </DashboardCard>
      </div>
    </div>
  )
}
