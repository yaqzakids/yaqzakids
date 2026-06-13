import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { useAuth } from '@/components/ProtectedRoute'
import { useSelectedChild } from '@/context/SelectedChildContext'
import LoadingSpinner from '@/components/LoadingSpinner'
import BadgeHexagon from '@/components/discoverer/BadgeHexagon'
import TealProgressBar from '@/components/discoverer/TealProgressBar'
import {
  DISCOVERER_BADGE_DISPLAY,
  fetchDiscovererHomepageData,
  type DiscovererHomepageData,
} from '@/lib/discoverer'
import { getLevelProgress } from '@/lib/adventure/levels'

const HERO_IMAGE =
  'https://i.ibb.co/pjFS3JM6/Chat-GPT-Image-Jun-3-2026-04-45-19-PM.png'

const FALLBACK_FEATURED = {
  category: 'Science & Nature',
  title: 'Why Bees Matter',
  description:
    'Bees are tiny, but they do an enormous job keeping plants healthy and food growing all around the world.',
  readingTime: 6,
  cover:
    'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&q=80',
}

const FALLBACK_CONTINUE = [
  { name: 'Science & Nature', pct: 60, cover: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=80' },
  { name: 'History & People', pct: 45, cover: 'https://images.unsplash.com/photo-1461360228754-6e81c3780fee?w=400&q=80' },
  { name: 'Current Events', pct: 30, cover: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&q=80' },
  { name: 'Foundations of Faith', pct: 20, cover: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80' },
]

const FALLBACK_RECOMMENDED = [
  { title: 'The Amazing Human Brain', category: 'Science & Nature', time: 7, xp: 25 },
  { title: 'What Is Climate Change?', category: 'Environment', time: 8, xp: 25 },
  { title: 'The Great Migrations', category: 'Geography & Cultures', time: 6, xp: 25 },
  { title: 'Islamic Golden Age of Invention', category: 'History', time: 9, xp: 30 },
]

const LEARNING_PATHS = [
  { emoji: '🔬', name: 'Science & Nature', border: 'border-teal', articles: 5, pct: 60 },
  { emoji: '🏛️', name: 'History & Civilization', border: 'border-gold', articles: 5, pct: 45 },
  { emoji: '📰', name: 'Current Events', border: 'border-coral', articles: 5, pct: 30 },
  { emoji: '🤖', name: 'Technology & AI', border: 'border-purple', articles: 5, pct: 0 },
  { emoji: '🌍', name: 'Geography & Cultures', border: 'border-navy', articles: 5, pct: 15 },
  { emoji: '🌱', name: 'Environment', border: 'border-green-500', articles: 5, pct: 0 },
  { emoji: '✨', name: 'Foundations of Faith', border: 'border-gold', articles: 5, pct: 20 },
]

const FAITH_CARDS = [
  { icon: '🌟', title: 'Wonder at Creation', text: "Science helps us discover Allah's signs." },
  { icon: '📖', title: 'Guided by Revelation', text: 'The Quran helps us understand life.' },
  { icon: '⚡', title: 'Character in Action', text: 'Knowledge should make us better people.' },
  { icon: '🎯', title: 'Purposeful Learning', text: 'Learning is a trust and way to serve.' },
]

export default function Discoverer() {
  const { user } = useAuth()
  const { selectedChild } = useSelectedChild()
  const [data, setData] = useState<DiscovererHomepageData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchDiscovererHomepageData(
      selectedChild?.id ?? null,
      user?.id ?? null,
      selectedChild?.name ?? 'Explorer'
    )
      .then((d) => {
        if (!cancelled) setData(d)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedChild?.id, user?.id, selectedChild?.name])

  const stats = data?.stats
  const childName = data?.childName ?? 'Explorer'
  const levelInfo = getLevelProgress(stats?.stars ?? 560)
  const xpCurrent = stats?.stars ?? 560
  const xpNext = xpCurrent + (stats?.starsToNext ?? 280)

  const featured = data?.featuredArticle
  const featuredTitle = featured?.title ?? FALLBACK_FEATURED.title
  const featuredDesc =
    featured?.excerpt ??
    featured?.content_discoverer?.slice(0, 120) ??
    FALLBACK_FEATURED.description
  const featuredCover = featured?.cover_image_url ?? FALLBACK_FEATURED.cover
  const featuredTime = featured?.reading_time_minutes ?? FALLBACK_FEATURED.readingTime

  return (
    <div className="min-h-screen page-transition bg-white">
      <SiteNav variant="discoverer" />

      {/* HERO */}
      <section className="bg-[#1B2F5E] text-white">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-12 md:py-16 grid md:grid-cols-[55%_45%] gap-10 items-center">
          <div>
            <h1
              className="font-display font-bold text-white leading-tight mb-5"
              style={{ fontSize: 'clamp(2rem, 4vw, 52px)' }}
            >
              Discover <span className="text-[#F5A623]">Allah&apos;s</span> World,
              <br />
              One Story at a Time.
            </h1>
            <p className="text-white/80 text-[17px] leading-relaxed mb-8 max-w-lg">
              Read exciting stories about science, nature, history, and today&apos;s world — with
              Islamic reflections made for curious Muslim kids.
            </p>
            <div className="flex flex-wrap gap-3 mb-8">
              <Link
                to="/discoverer/mission"
                className="px-6 py-3 rounded-full font-extrabold text-[#1B2F5E] bg-[#F5A623] hover:opacity-90 transition-opacity"
              >
                🚀 Start Today&apos;s Mission
              </Link>
              <Link
                to="/discoverer/explore"
                className="px-6 py-3 rounded-full font-extrabold border-2 border-white text-white hover:bg-white/10 transition-colors"
              >
                Explore Stories
              </Link>
            </div>
            <div className="flex flex-wrap gap-3">
              {[
                `⭐ ${(stats?.stars ?? 560).toLocaleString()} Stars`,
                `🔥 ${stats?.streak ?? 7} Day Streak`,
                `📚 ${stats?.articlesRead ?? 12} Articles Read`,
                `🏆 ${stats?.badgesCount ?? 3} Badges`,
              ].map((pill) => (
                <span
                  key={pill}
                  className="px-4 py-2 rounded-full text-sm font-bold bg-white/10"
                >
                  {pill}
                </span>
              ))}
            </div>
          </div>
          <div className="flex justify-center">
            <img
              src={HERO_IMAGE}
              alt="Discoverer adventure"
              className="w-full max-w-md rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* DASHBOARD STRIP */}
      <section className="bg-white py-8 px-6 md:px-10">
        <div className="max-w-7xl mx-auto grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-teal flex items-center justify-center text-2xl">
                👧
              </div>
              <div>
                <p className="font-bold text-navy">Welcome back, {childName}! 👋</p>
                <p className="text-xs text-muted">You&apos;re on a great learning adventure</p>
              </div>
            </div>
            <span className="inline-block text-xs font-extrabold bg-teal/10 text-teal px-3 py-1 rounded-full mb-3">
              Discoverer {levelInfo.currentLevel}
            </span>
            <TealProgressBar value={xpCurrent} max={xpNext} showLabel />
            <p className="text-xs text-muted mt-1">{xpCurrent}/{xpNext} XP</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <p className="font-bold text-navy mb-3">🎯 Daily Mission</p>
            <ul className="space-y-2 text-sm text-navy mb-3">
              <li>✅ Read 1 story</li>
              <li>✅ Pass 1 quiz</li>
              <li>⭕ Answer 1 reflection</li>
            </ul>
            <p className="text-xs font-bold text-teal mb-2">+10 ⭐ when you finish!</p>
            <TealProgressBar value={66} max={100} />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center">
            <p className="font-bold text-navy mb-2">🔥 Current Streak</p>
            <p className="text-5xl font-extrabold text-[#F5A623]">{stats?.streak ?? 7}</p>
            <p className="text-sm text-muted">days</p>
            <p className="text-sm font-bold text-navy mt-2">Keep it going!</p>
            <p className="text-3xl mt-2">🔥</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center">
            <p className="font-bold text-navy mb-2">⭐ Stars Earned</p>
            <p className="text-5xl font-extrabold text-[#F5A623]">
              {(stats?.stars ?? 560).toLocaleString()}
            </p>
            <p className="text-sm font-bold text-navy mt-2">Keep learning!</p>
            <p className="text-3xl mt-2">🏆</p>
          </div>
        </div>
      </section>

      {loading && (
        <div className="py-12 flex justify-center">
          <LoadingSpinner />
        </div>
      )}

      {/* FEATURED STORY */}
      <section className="bg-[#EEF4FF] py-12 px-6 md:px-10">
        <div className="max-w-7xl mx-auto">
          <p className="text-teal text-xs font-extrabold tracking-widest uppercase mb-4">
            Today&apos;s Featured Story
          </p>
          <div className="bg-white rounded-2xl shadow-md overflow-hidden grid md:grid-cols-2 gap-0">
            <img
              src={featuredCover}
              alt=""
              className="w-full h-full min-h-[220px] object-cover md:rounded-l-2xl"
            />
            <div className="p-8 flex flex-col justify-center">
              <span className="text-teal text-xs font-extrabold uppercase mb-2">
                {FALLBACK_FEATURED.category}
              </span>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-navy mb-3">
                {featuredTitle}
              </h2>
              <p className="text-muted leading-relaxed mb-4">{featuredDesc}…</p>
              <p className="text-sm text-muted mb-6">
                {featuredTime} min read • Ages 9–12
              </p>
              <Link
                to={featured ? '/discoverer/explore' : '/discoverer/explore'}
                className="inline-flex self-start px-6 py-3 bg-teal text-white rounded-full font-extrabold hover:opacity-90"
              >
                Read Story →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CONTINUE LEARNING */}
      <section className="py-12 px-6 md:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display text-2xl font-bold text-navy">Continue Learning</h2>
            <Link to="/adventures" className="text-teal text-sm font-bold hover:underline">
              View all →
            </Link>
          </div>
          <p className="text-muted mb-6">Pick up where you left off</p>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {(data?.continuePaths.length ? data.continuePaths : null)?.map((path) => (
              <div
                key={path.id}
                className="shrink-0 w-56 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <img
                  src={path.cover_image_url ?? FALLBACK_CONTINUE[0].cover}
                  alt=""
                  className="w-full h-[120px] object-cover"
                />
                <div className="p-4">
                  <p className="font-bold text-navy text-sm mb-2">{path.title}</p>
                  <TealProgressBar
                    value={path.path_progress?.completion_percentage ?? 0}
                    showLabel
                    className="mb-3"
                  />
                  <Link
                    to={`/adventures/${path.slug}`}
                    className="text-teal text-sm font-extrabold"
                  >
                    Continue →
                  </Link>
                </div>
              </div>
            )) ??
              FALLBACK_CONTINUE.map((p) => (
                <div
                  key={p.name}
                  className="shrink-0 w-56 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  <img src={p.cover} alt="" className="w-full h-[120px] object-cover" />
                  <div className="p-4">
                    <p className="font-bold text-navy text-sm mb-2">{p.name}</p>
                    <TealProgressBar value={p.pct} showLabel className="mb-3" />
                    <Link to="/adventures" className="text-teal text-sm font-extrabold">
                      Continue →
                    </Link>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* RECOMMENDED */}
      <section className="py-12 px-6 md:px-10 bg-[#FFF8ED]">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-display text-2xl font-bold text-navy mb-1">Recommended For You</h2>
          <p className="text-muted mb-6">Stories picked just for you</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {(data?.recommendedArticles.length ? data.recommendedArticles : null)?.map((a) => (
              <div key={a.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <img
                  src={a.cover_image_url ?? featuredCover}
                  alt=""
                  className="w-full h-40 object-cover rounded-t-2xl"
                />
                <div className="p-4">
                  <span className="text-xs font-bold text-teal uppercase">Story</span>
                  <h3 className="font-bold text-navy mt-1 mb-2 line-clamp-2">{a.title}</h3>
                  <p className="text-xs text-muted mb-3">
                    {a.reading_time_minutes} min • +25 ⭐
                  </p>
                  <Link
                    to="/discoverer/explore"
                    className="block text-center py-2 bg-teal text-white rounded-full text-sm font-extrabold"
                  >
                    Read
                  </Link>
                </div>
              </div>
            )) ??
              FALLBACK_RECOMMENDED.map((a) => (
                <div key={a.title} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="w-full h-40 bg-gradient-to-br from-[#EEF4FF] to-teal/20 rounded-t-2xl" />
                  <div className="p-4">
                    <span className="text-xs font-bold text-teal uppercase">{a.category}</span>
                    <h3 className="font-bold text-navy mt-1 mb-2">{a.title}</h3>
                    <p className="text-xs text-muted mb-3">
                      {a.time} min • +{a.xp} ⭐
                    </p>
                    <Link
                      to="/discoverer/explore"
                      className="block text-center py-2 bg-teal text-white rounded-full text-sm font-extrabold"
                    >
                      Read
                    </Link>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* BADGES */}
      <section className="py-12 px-6 md:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-bold text-navy">My Badges</h2>
            <Link to="/discoverer/badges" className="text-teal text-sm font-bold hover:underline">
              View all →
            </Link>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-2">
            {DISCOVERER_BADGE_DISPLAY.map((b) => (
              <BadgeHexagon
                key={b.slug}
                icon={b.icon}
                name={b.name}
                color={b.color}
                earned
                subtitle="Earned"
              />
            ))}
          </div>
        </div>
      </section>

      {/* ROOTED IN FAITH */}
      <section className="bg-[#1B2F5E] py-14 px-6 md:px-10">
        <div className="max-w-7xl mx-auto text-center mb-10">
          <h2 className="font-display text-3xl font-bold text-white mb-3">
            Rooted in Faith. Awake to the World.
          </h2>
          <p className="text-white/70 max-w-2xl mx-auto">
            Every story connects to what Muslims believe about Allah, creation, and how we live with
            purpose.
          </p>
        </div>
        <div className="max-w-7xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FAITH_CARDS.map((c) => (
            <div key={c.title} className="bg-white/10 rounded-2xl p-6 text-white">
              <p className="text-3xl mb-3">{c.icon}</p>
              <h3 className="font-bold text-lg mb-2">{c.title}</h3>
              <p className="text-white/80 text-sm leading-relaxed">{c.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* LEARNING PATHS */}
      <section className="py-12 px-6 md:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display text-2xl font-bold text-navy">My Learning Paths</h2>
            <Link to="/adventures" className="text-teal text-sm font-bold hover:underline">
              View all →
            </Link>
          </div>
          <p className="text-muted mb-6">Complete paths to earn badges and certificates</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {LEARNING_PATHS.map((p) => (
              <div
                key={p.name}
                className={`bg-white rounded-2xl shadow-sm border border-gray-100 border-t-4 ${p.border} p-5`}
              >
                <p className="text-4xl mb-3">{p.emoji}</p>
                <h3 className="font-bold text-navy mb-1">{p.name}</h3>
                <p className="text-sm text-muted mb-3">{p.articles} articles</p>
                {p.pct > 0 && <TealProgressBar value={p.pct} showLabel className="mb-4" />}
                <Link
                  to="/adventures"
                  className="inline-block px-5 py-2 bg-teal text-white rounded-full text-sm font-extrabold"
                >
                  {p.pct > 0 ? 'Continue' : 'Start'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PARENT PREVIEW */}
      <section className="bg-[#EEF4FF] py-10 px-6 md:px-10">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-6 md:p-8">
          <p className="text-sm font-bold text-teal mb-2">For Parents 👨‍👩‍👧</p>
          <p className="text-navy leading-relaxed mb-4">
            This week {childName} learned about stewardship, knowledge, and Allah&apos;s signs in
            nature.
          </p>
          <Link
            to="/dashboard"
            className="inline-block px-5 py-2.5 bg-navy text-white rounded-full text-sm font-extrabold hover:opacity-90"
          >
            View Full Report →
          </Link>
        </div>
      </section>

      <SiteFooter variant="light" />
    </div>
  )
}
