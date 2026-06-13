import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SiteNav } from '@/components/SiteNav'
import LoadingSpinner from '@/components/LoadingSpinner'
import UserAvatar from '@/components/UserAvatar'
import { useSelectedChild } from '@/context/SelectedChildContext'
import { fetchChildStats } from '@/lib/discoverer'
import { AGE_GROUP_META } from '@/lib/childProfiles'

export default function ThinkerDashboard() {
  const { selectedChild } = useSelectedChild()
  const [stats, setStats] = useState<Awaited<ReturnType<typeof fetchChildStats>> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!selectedChild) return
    let cancelled = false
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
  }, [selectedChild?.id])

  if (!selectedChild) return null

  const meta = AGE_GROUP_META.thinker

  return (
    <div className="min-h-screen bg-navy page-transition">
      <SiteNav variant="thinker" />
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center gap-4 mb-8">
          <UserAvatar name={selectedChild.name} avatarId={selectedChild.avatar_id ?? null} size={56} />
          <div>
            <h1 className="font-display text-2xl font-bold text-white">
              Welcome back, {selectedChild.name}
            </h1>
            <p className="text-sm text-white/70">
              {meta.label} · Ages {meta.ages} · {stats?.level ?? 'Seeker'}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-16 flex justify-center"><LoadingSpinner /></div>
        ) : (
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white/10 rounded-2xl p-5 text-center">
              <p className="text-2xl font-extrabold text-gold">⭐ {stats?.stars.toLocaleString() ?? 0}</p>
              <p className="text-xs text-white/70 font-bold">Stars</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-5 text-center">
              <p className="text-2xl font-extrabold text-gold">🔥 {stats?.streak ?? 0}</p>
              <p className="text-xs text-white/70 font-bold">Day Streak</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-5 text-center">
              <p className="text-2xl font-extrabold text-purple">{stats?.articlesRead ?? 0}</p>
              <p className="text-xs text-white/70 font-bold">Articles Read</p>
            </div>
          </div>
        )}

        <Link
          to="/adventures"
          className="block bg-gold text-navy rounded-2xl p-6 text-center font-extrabold hover:opacity-90"
        >
          🗺️ Explore Learning Paths →
        </Link>
      </div>
    </div>
  )
}
