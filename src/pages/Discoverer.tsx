import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { useAuth } from '@/components/ProtectedRoute'
import { useSelectedChild } from '@/context/SelectedChildContext'
import LoadingSpinner from '@/components/LoadingSpinner'
import BadgeDetailModal from '@/components/discoverer/BadgeDetailModal'
import TealProgressBar from '@/components/discoverer/TealProgressBar'
import SignedOutDiscovererHero from '@/components/discoverer/SignedOutDiscovererHero'
import SignedInDiscovererHero from '@/components/discoverer/SignedInDiscovererHero'
import DiscovererProgressSnapshot from '@/components/discoverer/DiscovererProgressSnapshot'
import {
  FAITH_CARDS,
  LEARNING_PATHS_HOME,
  fetchDiscovererHomepageData,
  fetchDailyMission,
  fetchLastUnfinishedArticle,
  fetchChildCertificates,
  type DiscovererBadgeDisplay,
  type DiscovererHomepageData,
  type LastUnfinishedArticle,
} from '@/lib/discoverer'
import {
  SIGNED_IN_FEATURED_STORY,
  SIGNED_IN_RECOMMENDED,
  SIGNED_OUT_FEATURED_STORY,
  SIGNED_OUT_SAMPLE_STORIES,
  type DiscovererFeaturedStory,
  type DiscovererStoryCard,
} from '@/lib/discovererHomeContent'
import { getLevelProgress, STAR_LEVELS } from '@/lib/adventure/levels'
import type { Certificate } from '@/lib/types'

function levelNumber(totalStars: number): number {
  let idx = 0
  for (let i = 0; i < STAR_LEVELS.length; i++) {
    if (totalStars >= STAR_LEVELS[i].min) idx = i
  }
  return idx + 1
}

function FeaturedStorySection({
  label,
  story,
}: {
  label: string
  story: DiscovererFeaturedStory
}) {
  return (
    <section className="mb-10">
      <p className="text-[#2AAFA0] text-xs font-extrabold tracking-widest uppercase mb-3">{label}</p>
      <div className="bg-white rounded-2xl shadow-md overflow-hidden grid md:grid-cols-2 border border-white">
        <img src={story.image} alt="" className="w-full h-full min-h-[240px] object-cover" />
        <div className="p-8 flex flex-col justify-center">
          <span className="text-[#2AAFA0] text-xs font-extrabold uppercase mb-2">{story.category}</span>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-[#1B2F5E] mb-3">{story.title}</h2>
          <p className="text-[#6B7280] leading-relaxed mb-4 text-[15px]">{story.description}</p>
          <p className="text-sm text-[#6B7280] mb-6">
            {story.readingTime} min read · {story.ageTag}
          </p>
          <Link
            to={story.url}
            className="inline-flex self-start px-6 py-3 bg-[#2AAFA0] text-white rounded-full font-extrabold hover:opacity-90 shadow-sm"
          >
            {story.ctaLabel}
          </Link>
        </div>
      </div>
    </section>
  )
}

function LearningPathsSection({
  isSignedIn,
  continuePaths,
}: {
  isSignedIn: boolean
  continuePaths: DiscovererHomepageData['continuePaths']
}) {
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-bold text-[#1B2F5E]">
          {isSignedIn ? 'Explore Learning Paths' : 'Learning Paths'}
        </h2>
        <Link
          to={isSignedIn ? '/adventures' : '/paths'}
          className="text-[#2AAFA0] text-sm font-extrabold"
        >
          View all →
        </Link>
      </div>
      <p className="text-sm text-[#6B7280] mb-5">
        {isSignedIn
          ? 'Long-term adventures across science, history, faith, and more'
          : 'Stories across science, history, faith, and more'}
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {LEARNING_PATHS_HOME.map((p) => {
          const live = continuePaths.find(
            (cp) =>
              cp.slug === p.slug ||
              cp.title.toLowerCase().includes(p.name.split(' ')[0].toLowerCase())
          )
          const pct = isSignedIn ? (live?.path_progress?.completion_percentage ?? 0) : 0
          return (
            <div
              key={p.name}
              className={`bg-white rounded-2xl shadow-sm border-t-4 ${p.border} p-5`}
            >
              <p className="text-3xl mb-2">{p.emoji}</p>
              <h3 className="font-bold text-[#1B2F5E] mb-1">{p.name}</h3>
              <p className="text-xs text-[#6B7280] mb-3">{p.articles} articles</p>
              {isSignedIn && pct > 0 ? (
                <TealProgressBar value={pct} showLabel className="mb-4" />
              ) : isSignedIn ? (
                <p className="text-xs text-[#6B7280] mb-4 font-semibold">Begin your first path</p>
              ) : null}
              <Link
                to={isSignedIn ? `/adventures/${live?.slug ?? p.slug}` : '/signup'}
                className="inline-block px-5 py-2 bg-[#2AAFA0] text-white rounded-full text-sm font-extrabold"
              >
                {isSignedIn ? (pct > 0 ? 'Continue' : 'Start') : 'Start Free'}
              </Link>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function FaithSection() {
  return (
    <section className="mb-10">
      <h2 className="font-display text-2xl font-bold text-[#1B2F5E] mb-2 text-center">
        Rooted in Faith. Awake to the World.
      </h2>
      <p className="text-center text-[#6B7280] text-sm mb-8 max-w-xl mx-auto">
        YaqzaKids connects curiosity, character, and purpose in every story.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {FAITH_CARDS.map((card) => (
          <div
            key={card.title}
            className="bg-white rounded-2xl shadow-sm p-6 text-center border border-[#EEF4FF]"
          >
            <p className="text-3xl mb-3" aria-hidden>
              {card.icon}
            </p>
            <h3 className="font-bold text-[#1B2F5E] mb-2">{card.title}</h3>
            <p className="text-sm text-[#6B7280] leading-relaxed">{card.text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function RecommendedCard({ card }: { card: DiscovererStoryCard }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#EEF4FF] overflow-hidden hover:shadow-md transition-shadow flex flex-col">
      <img src={card.image} alt="" className="w-full h-32 object-cover" />
      <div className="p-4 flex flex-col flex-1">
        <p className="text-[10px] font-extrabold text-[#2AAFA0] uppercase mb-1">{card.category}</p>
        <h3 className="font-bold text-[#1B2F5E] text-sm line-clamp-2 mb-2">{card.title}</h3>
        <p className="text-xs text-[#6B7280] mb-3">{card.readingTime} min read</p>
        {card.starsReward != null && (
          <p className="text-xs font-extrabold text-[#F5A623] mb-4">⭐ +{card.starsReward} stars</p>
        )}
        <Link
          to={card.url}
          className="mt-auto inline-flex justify-center px-4 py-2 bg-[#2AAFA0] text-white rounded-full text-sm font-extrabold hover:opacity-90"
        >
          Read →
        </Link>
      </div>
    </div>
  )
}

export default function Discoverer() {
  const { user } = useAuth()
  const { selectedChild, loading: childLoading } = useSelectedChild()
  const [data, setData] = useState<DiscovererHomepageData | null>(null)
  const [missionDone, setMissionDone] = useState({ read: false, quiz: false, reflection: false })
  const [lastArticle, setLastArticle] = useState<LastUnfinishedArticle | null>(null)
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [selectedBadge, setSelectedBadge] = useState<DiscovererBadgeDisplay | null>(null)
  const [loading, setLoading] = useState(true)

  const isSignedIn = Boolean(user && selectedChild)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    if (!selectedChild) {
      fetchDiscovererHomepageData(null, user?.id ?? null)
        .then((home) => {
          if (cancelled) return
          setData(home)
          setMissionDone({ read: false, quiz: false, reflection: false })
          setLastArticle(null)
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
      return () => {
        cancelled = true
      }
    }

    Promise.all([
      fetchDiscovererHomepageData(selectedChild.id, user?.id ?? null, selectedChild.name),
      fetchDailyMission(selectedChild.id),
      fetchLastUnfinishedArticle(selectedChild.id),
      fetchChildCertificates(selectedChild.id),
    ])
      .then(([home, mission, last, certs]) => {
        if (cancelled) return
        setData(home)
        setLastArticle(last)
        setCertificates(certs)
        if (mission) {
          setMissionDone({
            read: mission.readStory,
            quiz: mission.passQuiz,
            reflection: mission.answerReflection,
          })
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedChild?.id, user?.id, selectedChild?.name])

  const stats = data?.stats
  const childName = selectedChild?.name ?? ''
  const stars = stats?.stars ?? 0
  const streak = stats?.streak ?? 0
  const levelInfo = getLevelProgress(stars)
  const lvl = levelNumber(stars)
  const earnedBadgeSlugs = new Set(
    (data?.badges ?? []).filter((b) => b.earned).map((b) => b.slug)
  )
  const activePaths = data?.continuePaths ?? []

  return (
    <div className="min-h-screen bg-[#EEF4FF] page-transition flex flex-col">
      <SiteNav variant="discoverer" />
      <BadgeDetailModal
        badge={selectedBadge}
        earned={selectedBadge ? earnedBadgeSlugs.has(selectedBadge.slug) : false}
        onClose={() => setSelectedBadge(null)}
      />

      <div className="pb-16">
        {childLoading ? (
          <SignedOutDiscovererHero />
        ) : isSignedIn ? (
          <SignedInDiscovererHero
            childName={childName}
            avatarId={selectedChild!.avatar_id ?? null}
            levelNumber={lvl}
            levelName={levelInfo.currentLevel}
            missionDone={missionDone}
            lastArticle={lastArticle}
          />
        ) : (
          <SignedOutDiscovererHero />
        )}

        <div className="max-w-[1280px] mx-auto px-5 md:px-8">
          {loading && (
            <div className="pt-6 pb-4 flex justify-center">
              <LoadingSpinner />
            </div>
          )}

          {!loading && isSignedIn && (
            <>
              <DiscovererProgressSnapshot
                childName={childName}
                avatarId={selectedChild?.avatar_id ?? null}
                levelLabel={levelInfo.currentLevel}
                xp={stars}
                starsToNext={levelInfo.starsToNext}
                streak={streak}
                paths={activePaths}
                certificateCount={certificates.length}
                missionDone={missionDone}
                earnedBadgeSlugs={earnedBadgeSlugs}
              />

              {/* 1. Continue Learning */}
              <section className="mb-10 pt-4">
                <h2 className="font-display text-xl font-bold text-[#1B2F5E] mb-4">Continue Learning</h2>
                {lastArticle ? (
                  <Link
                    to={lastArticle.url}
                    className="block bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow border border-[#EEF4FF] md:flex"
                  >
                    <div className="md:w-48 h-40 md:h-auto bg-gradient-to-br from-[#1B2F5E] to-[#2AAFA0] flex items-center justify-center shrink-0">
                      <span className="text-5xl" aria-hidden>
                        📖
                      </span>
                    </div>
                    <div className="p-6 flex-1">
                      <p className="text-[10px] font-extrabold text-[#2AAFA0] uppercase mb-1">Last article</p>
                      <p className="font-bold text-[#1B2F5E] text-lg mb-1">{lastArticle.title}</p>
                      <p className="text-sm text-[#6B7280] mb-3">{lastArticle.statusLabel}</p>
                      <span className="text-[#2AAFA0] font-extrabold text-sm">Resume →</span>
                    </div>
                  </Link>
                ) : activePaths[0] ? (
                  <Link
                    to={`/adventures/${activePaths[0].slug}`}
                    className="block bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow border border-[#EEF4FF] md:flex"
                  >
                    {activePaths[0].cover_image_url ? (
                      <img
                        src={activePaths[0].cover_image_url}
                        alt=""
                        className="w-full md:w-48 h-40 md:h-auto object-cover shrink-0"
                      />
                    ) : (
                      <div className="md:w-48 h-40 bg-gradient-to-br from-[#EEF4FF] to-[#2AAFA0]/30 shrink-0" />
                    )}
                    <div className="p-6 flex-1">
                      <p className="text-[10px] font-extrabold text-[#2AAFA0] uppercase mb-1">Learning path</p>
                      <p className="font-bold text-[#1B2F5E] text-lg mb-2">{activePaths[0].title}</p>
                      <TealProgressBar
                        value={activePaths[0].path_progress?.completion_percentage ?? 0}
                        showLabel
                        className="mb-3 max-w-xs"
                      />
                      <span className="text-[#2AAFA0] font-extrabold text-sm">Continue →</span>
                    </div>
                  </Link>
                ) : (
                  <div className="bg-white rounded-2xl shadow-sm p-8 text-center border border-[#EEF4FF]">
                    <p className="text-4xl mb-3" aria-hidden>
                      🚀
                    </p>
                    <p className="font-bold text-[#1B2F5E] text-lg mb-2">Start your first adventure</p>
                    <p className="text-sm text-[#6B7280] mb-5">
                      Complete today&apos;s mission to earn stars and begin your journey.
                    </p>
                    <Link
                      to="/discoverer/mission"
                      className="inline-flex px-6 py-2.5 bg-[#2AAFA0] text-white rounded-full font-extrabold text-sm shadow-sm hover:opacity-90"
                    >
                      Start Today&apos;s Mission →
                    </Link>
                  </div>
                )}
              </section>

              {/* 2. Today's Featured Story */}
              <FeaturedStorySection label="Today's Featured Story" story={SIGNED_IN_FEATURED_STORY} />

              {/* 3. Discover Something New Today */}
              <section className="mb-10">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <h2 className="font-display text-xl font-bold text-[#1B2F5E]">
                    ✨ Discover Something New Today
                  </h2>
                  <Link to="/discoverer/explore" className="text-[#2AAFA0] text-sm font-extrabold shrink-0">
                    Explore all →
                  </Link>
                </div>
                <p className="text-sm text-[#6B7280] mb-5 max-w-2xl">
                  Stories picked to match your interests, progress, and learning journey.
                </p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {SIGNED_IN_RECOMMENDED.map((card) => (
                    <RecommendedCard key={card.title} card={card} />
                  ))}
                </div>
              </section>

              {/* 4. Explore Learning Paths */}
              <LearningPathsSection isSignedIn continuePaths={activePaths} />

              {/* 5. Rooted in Faith */}
              <FaithSection />
            </>
          )}

          {!loading && !isSignedIn && (
            <>
              {/* 1. Curiosity Starts Here */}
              <section id="curiosity-starts-here" className="mb-10 pt-8 scroll-mt-24">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <h2 className="font-display text-xl md:text-2xl font-bold text-[#1B2F5E]">
                    🧠 Curiosity Starts Here
                  </h2>
                  <Link to="/sample-stories" className="text-[#2AAFA0] text-sm font-extrabold shrink-0">
                    View all →
                  </Link>
                </div>
                <p className="text-sm text-[#6B7280] mb-5 max-w-2xl">
                  Explore science, history, nature, technology, and inspiring stories from around the world.
                </p>
                <div className="grid sm:grid-cols-3 gap-5">
                  {SIGNED_OUT_SAMPLE_STORIES.map((story) => (
                    <div
                      key={story.title}
                      className="bg-white rounded-2xl shadow-sm overflow-hidden border border-white hover:shadow-md transition-shadow flex flex-col"
                    >
                      <img src={story.image} alt="" className="w-full h-40 object-cover" />
                      <div className="p-5 flex flex-col flex-1">
                        <p className="text-[10px] font-extrabold text-[#2AAFA0] uppercase mb-1">
                          {story.category}
                        </p>
                        <h3 className="font-bold text-[#1B2F5E] text-sm line-clamp-2 mb-2">{story.title}</h3>
                        <p className="text-sm text-[#6B7280] leading-relaxed mb-3 flex-1">
                          {story.description}
                        </p>
                        <span className="inline-block text-[10px] font-bold text-[#1B2F5E]/60 bg-[#EEF4FF] rounded-full px-2.5 py-1 mb-4 w-fit">
                          {story.ageTag}
                        </span>
                        <Link
                          to={story.url}
                          className="inline-flex justify-center px-4 py-2.5 bg-[#2AAFA0] text-white rounded-full text-sm font-extrabold hover:opacity-90"
                        >
                          Read Story →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 2. Featured Story */}
              <FeaturedStorySection label="Featured Story" story={SIGNED_OUT_FEATURED_STORY} />

              {/* 3. Learning Paths */}
              <LearningPathsSection isSignedIn={false} continuePaths={activePaths} />

              {/* 4. Parent Value Section */}
              <section className="mb-10 bg-white rounded-2xl shadow-sm p-8 md:p-10 border border-[#EEF4FF]">
                <p className="text-[#2AAFA0] text-xs font-extrabold tracking-widest uppercase mb-2">
                  For Parents
                </p>
                <h2 className="font-display text-2xl font-bold text-[#1B2F5E] mb-3">
                  Safe, meaningful learning for your child
                </h2>
                <p className="text-[#6B7280] max-w-2xl mb-6 leading-relaxed">
                  Track progress, manage child profiles, and explore a curriculum rooted in Islamic values —
                  without ads or distractions.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    to="/parents"
                    className="inline-flex px-6 py-3 bg-[#1B2F5E] text-white rounded-full font-extrabold text-sm"
                  >
                    Learn more for parents →
                  </Link>
                  <Link
                    to="/signup"
                    className="inline-flex px-6 py-3 border-2 border-[#2AAFA0] text-[#2AAFA0] rounded-full font-extrabold text-sm"
                  >
                    Start free →
                  </Link>
                </div>
              </section>

              {/* 5. Sign Up CTA */}
              <section className="mb-6 text-center bg-gradient-to-br from-[#1B2F5E] to-[#2AAFA0] rounded-2xl p-10 text-white shadow-md">
                <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">Start your free adventure</h2>
                <p className="text-white/85 mb-6 max-w-md mx-auto">
                  Create a free account to save progress, earn stars, and unlock the full Discoverer experience.
                </p>
                <Link
                  to="/signup"
                  className="inline-flex px-8 py-3 bg-[#F5A623] text-[#1B2F5E] rounded-full font-extrabold hover:opacity-90"
                >
                  ✨ Create Free Account
                </Link>
              </section>
            </>
          )}
        </div>
      </div>
      <SiteFooter variant="light" />
    </div>
  )
}
