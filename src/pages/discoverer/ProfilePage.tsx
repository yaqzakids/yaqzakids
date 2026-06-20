import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DiscovererPageShell from '@/components/discoverer/DiscovererPageShell'
import LoadingSpinner from '@/components/LoadingSpinner'
import UserAvatar from '@/components/UserAvatar'
import TealProgressBar from '@/components/discoverer/TealProgressBar'
import { useSelectedChild } from '@/context/SelectedChildContext'
import { fetchChildStats } from '@/lib/discoverer'
import { getLevelProgress, STAR_LEVELS } from '@/lib/adventure/levels'
import DailyDuaCard from '@/components/parent/DailyDuaCard'

function levelNumber(totalStars: number): number {
  let idx = 0
  for (let i = 0; i < STAR_LEVELS.length; i++) {
    if (totalStars >= STAR_LEVELS[i].min) idx = i
  }
  return idx + 1
}

const QUICK_LINKS = [
  { to: '/discoverer/badges', label: 'My Badges', icon: '🏅' },
  { to: '/discoverer/certificates', label: 'My Certificates', icon: '📜' },
  { to: '/discoverer/rewards', label: 'Stars & Rewards', icon: '⭐' },
  { to: '/parent/dashboard', label: 'Parent Dashboard', icon: '👨‍👩‍👧' },
] as const

export default function ProfilePage() {
  const { selectedChild, loading: childLoading } = useSelectedChild()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Awaited<ReturnType<typeof fetchChildStats>> | null>(null)

  useEffect(() => {
    if (childLoading || !selectedChild) return
    let cancelled = false
    setLoading(true)
    fetchChildStats(selectedChild.id)
      .then((s) => {
        if (!cancelled) setStats(s)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedChild?.id, childLoading])

  if (childLoading || loading) {
    return (
      <DiscovererPageShell>
        <div className="py-24 flex justify-center"><LoadingSpinner size="lg" /></div>
      </DiscovererPageShell>
    )
  }

  if (!selectedChild) {
    return (
      <DiscovererPageShell>
        <div className="max-w-7xl mx-auto py-24 px-6 md:px-10 text-center">
          <p className="text-navy font-bold mb-4">Sign in to view your profile.</p>
          <Link to="/login" className="text-teal font-extrabold hover:underline">Sign in →</Link>
        </div>
      </DiscovererPageShell>
    )
  }

  const stars = stats?.stars ?? 0
  const levelInfo = getLevelProgress(stars)
  const lvl = levelNumber(stars)
  const xpTarget = levelInfo.nextLevel ? stars + levelInfo.starsToNext : stars

  const statItems = [
    { icon: '⭐', label: 'Stars', value: stars.toLocaleString() },
    { icon: '🔥', label: 'Streak', value: String(stats?.streak ?? 0) },
    { icon: '📚', label: 'Articles', value: String(stats?.articlesRead ?? 0) },
    { icon: '🏆', label: 'Badges', value: String(stats?.badgesCount ?? 0) },
  ]

  return (
    <DiscovererPageShell>
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-10">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-navy">My Profile</h1>
          <p className="text-muted mt-1">Your progress, stats, and quick links.</p>
        </div>

        <div className="grid lg:grid-cols-[340px_1fr] gap-8 items-start">
          {/* Profile sidebar */}
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center lg:sticky lg:top-24">
            <UserAvatar
              name={selectedChild.name}
              avatarId={selectedChild.avatar_id ?? null}
              size={96}
              variant="profile"
            />
            <h2 className="font-display text-2xl font-bold text-navy mt-4">{selectedChild.name}</h2>
            <p className="text-muted text-sm mt-1">
              Discoverer · Level {lvl} · {levelInfo.currentLevel}
            </p>
            <div className="mt-6">
              <TealProgressBar value={levelInfo.progressPercent} showLabel />
              <p className="text-xs text-muted mt-2 font-semibold">
                {stars.toLocaleString()} / {xpTarget.toLocaleString()} XP
              </p>
            </div>
            <Link
              to="/profile/avatar"
              className="inline-block mt-6 text-sm font-extrabold text-teal hover:underline"
            >
              Choose avatar →
            </Link>
          </div>

          {/* Main content */}
          <div className="space-y-8 min-w-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {statItems.map((s) => (
                <div key={s.label} className="bg-white rounded-xl p-5 text-center shadow-sm">
                  <p className="text-2xl mb-2">{s.icon}</p>
                  <p className="text-xl md:text-2xl font-extrabold text-navy">{s.value}</p>
                  <p className="text-xs text-muted font-bold mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            <DailyDuaCard />

            <div>
              <h3 className="font-display text-lg font-bold text-navy mb-4">Quick links</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {QUICK_LINKS.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="flex items-center gap-3 bg-white rounded-xl px-5 py-4 font-bold text-navy shadow-sm hover:bg-[#EEF4FF] transition-colors"
                  >
                    <span className="text-xl" aria-hidden>{link.icon}</span>
                    <span>{link.label}</span>
                    <span className="ml-auto text-teal text-sm">→</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DiscovererPageShell>
  )
}
