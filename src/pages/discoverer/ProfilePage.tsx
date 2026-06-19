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
        <div className="max-w-lg mx-auto py-24 px-6 text-center">
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

  return (
    <DiscovererPageShell>
      <div className="max-w-lg mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center mb-6">
          <UserAvatar
            name={selectedChild.name}
            avatarId={selectedChild.avatar_id ?? null}
            size={80}
          />
          <h1 className="font-display text-2xl font-bold text-navy mt-4">{selectedChild.name}</h1>
          <p className="text-muted text-sm mt-1">
            Discoverer · Level {lvl} · {levelInfo.currentLevel}
          </p>
          <div className="mt-6 max-w-xs mx-auto">
            <TealProgressBar value={levelInfo.progressPercent} showLabel />
            <p className="text-xs text-muted mt-2 font-semibold">
              {stars.toLocaleString()} / {xpTarget.toLocaleString()} XP
            </p>
          </div>
          <Link
            to="/profile/avatar"
            className="inline-block mt-6 text-sm font-extrabold text-teal hover:underline"
          >
            Customize avatar →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-8">
          {[
            { icon: '⭐', label: 'Stars', value: stars.toLocaleString() },
            { icon: '🔥', label: 'Streak', value: String(stats?.streak ?? 0) },
            { icon: '📚', label: 'Articles', value: String(stats?.articlesRead ?? 0) },
            { icon: '🏆', label: 'Badges', value: String(stats?.badgesCount ?? 0) },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl p-4 text-center shadow-sm">
              <p className="text-xl mb-1">{s.icon}</p>
              <p className="text-lg font-extrabold text-navy">{s.value}</p>
              <p className="text-xs text-muted font-bold">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mb-8">
          <DailyDuaCard />
        </div>

        <div className="space-y-2">
          <Link to="/discoverer/badges" className="block bg-white rounded-xl px-5 py-3 font-bold text-navy shadow-sm hover:bg-[#EEF4FF]">
            My Badges →
          </Link>
          <Link to="/discoverer/certificates" className="block bg-white rounded-xl px-5 py-3 font-bold text-navy shadow-sm hover:bg-[#EEF4FF]">
            My Certificates →
          </Link>
          <Link to="/discoverer/rewards" className="block bg-white rounded-xl px-5 py-3 font-bold text-navy shadow-sm hover:bg-[#EEF4FF]">
            Stars & Rewards →
          </Link>
          <Link to="/parent/dashboard" className="block bg-white rounded-xl px-5 py-3 font-bold text-navy shadow-sm hover:bg-[#EEF4FF]">
            Parent Dashboard →
          </Link>
        </div>
      </div>
    </DiscovererPageShell>
  )
}
