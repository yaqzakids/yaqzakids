import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DiscovererPageShell from '@/components/discoverer/DiscovererPageShell'
import LoadingSpinner from '@/components/LoadingSpinner'
import BadgeHexagon from '@/components/discoverer/BadgeHexagon'
import TealProgressBar from '@/components/discoverer/TealProgressBar'
import { useSelectedChild } from '@/context/SelectedChildContext'
import {
  fetchChildStats,
  fetchDiscovererHomepageData,
  fetchChildCertificates,
  DISCOVERER_BADGE_DISPLAY,
} from '@/lib/discoverer'
import type { Certificate } from '@/lib/types'
import type { AdventureArticle, PathWithProgress } from '@/lib/adventure/types'
import { useAuth } from '@/components/ProtectedRoute'

export default function DiscovererDashboard() {
  const { user } = useAuth()
  const { selectedChild, loading: childLoading } = useSelectedChild()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Awaited<ReturnType<typeof fetchChildStats>> | null>(null)
  const [paths, setPaths] = useState<PathWithProgress[]>([])
  const [recommended, setRecommended] = useState<AdventureArticle[]>([])
  const [certificates, setCertificates] = useState<Certificate[]>([])

  useEffect(() => {
    if (childLoading) return
    if (!selectedChild) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    Promise.all([
      fetchChildStats(selectedChild.id),
      fetchDiscovererHomepageData(selectedChild.id, user?.id ?? null, selectedChild.name),
      fetchChildCertificates(selectedChild.id),
    ])
      .then(([s, home, certs]) => {
        if (cancelled) return
        setStats(s)
        setPaths(home.continuePaths)
        setRecommended(home.recommendedArticles)
        setCertificates(certs)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedChild?.id, childLoading, user?.id])

  if (childLoading || loading) {
    return (
      <DiscovererPageShell>
        <div className="py-24 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </DiscovererPageShell>
    )
  }

  if (!selectedChild) {
    return (
      <DiscovererPageShell>
        <div className="max-w-lg mx-auto py-24 px-6 text-center">
          <p className="text-navy font-bold text-lg mb-4">Select a child profile to view your dashboard.</p>
          <Link to="/login" className="text-teal font-extrabold hover:underline">
            Sign in →
          </Link>
        </div>
      </DiscovererPageShell>
    )
  }

  const streakDays = stats?.streak ?? 0
  const weekDots = Array.from({ length: 7 }, (_, i) => i < Math.min(streakDays, 7))

  return (
    <DiscovererPageShell>
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-10 grid lg:grid-cols-[65%_35%] gap-8">
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-teal flex items-center justify-center text-2xl">
                👧
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-navy">{selectedChild.name}</h1>
                <p className="text-sm text-teal font-bold">Discoverer {stats?.level ?? 'Level 1'}</p>
              </div>
            </div>
            <TealProgressBar value={stats?.xp ?? 0} max={(stats?.xp ?? 0) + (stats?.starsToNext ?? 100)} showLabel />
            <p className="text-sm text-muted mt-3">You&apos;re on a great learning adventure!</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-navy text-lg">🎯 Daily Mission</h2>
              <Link to="/discoverer/mission" className="text-teal text-sm font-bold">
                Go →
              </Link>
            </div>
            <ul className="space-y-2 text-sm text-navy mb-4">
              <li>⭕ Read 1 story</li>
              <li>⭕ Pass 1 quiz</li>
              <li>⭕ Answer 1 reflection</li>
            </ul>
            <p className="text-xs font-bold text-teal">+10 ⭐ bonus when complete</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-navy">My Badges</h2>
              <Link to="/discoverer/badges" className="text-teal text-sm font-bold">
                View all →
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto">
              {DISCOVERER_BADGE_DISPLAY.map((b) => (
                <BadgeHexagon key={b.slug} icon={b.icon} name={b.name} color={b.color} size="sm" />
              ))}
            </div>
          </div>

          {paths[0] && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-bold text-navy mb-4">Continue Learning</h2>
              <div className="flex gap-4 items-center">
                {paths[0].cover_image_url && (
                  <img src={paths[0].cover_image_url} alt="" className="w-24 h-24 rounded-xl object-cover" />
                )}
                <div className="flex-1">
                  <p className="font-bold text-navy">{paths[0].title}</p>
                  <TealProgressBar
                    value={paths[0].path_progress?.completion_percentage ?? 0}
                    showLabel
                    className="mt-2"
                  />
                  <Link
                    to={`/adventures/${paths[0].slug}`}
                    className="inline-block mt-3 text-teal font-extrabold text-sm"
                  >
                    Continue →
                  </Link>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-navy mb-4">Recommended For You</h2>
            {recommended.length === 0 ? (
              <p className="text-muted text-sm">No stories yet — explore the library!</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {recommended.slice(0, 4).map((a) => (
                  <div key={a.id} className="border border-gray-100 rounded-xl p-3">
                    <p className="font-bold text-navy text-sm line-clamp-2">{a.title}</p>
                    <p className="text-xs text-muted mt-1">{a.reading_time_minutes} min</p>
                    <Link to="/discoverer/explore" className="text-teal text-xs font-bold mt-2 inline-block">
                      Read →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-navy">My Learning Paths</h2>
              <Link to="/adventures" className="text-teal text-sm font-bold">
                View all →
              </Link>
            </div>
            {paths.length === 0 ? (
              <p className="text-muted text-sm">Start a path to track progress here.</p>
            ) : (
              <div className="space-y-4">
                {paths.map((p) => (
                  <div key={p.id}>
                    <p className="text-sm font-bold text-navy mb-1">{p.title}</p>
                    <TealProgressBar value={p.path_progress?.completion_percentage ?? 0} showLabel />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
            <p className="text-4xl mb-2">🔥</p>
            <p className="text-4xl font-extrabold text-[#F5A623]">{streakDays}</p>
            <p className="text-sm text-muted mb-4">day streak</p>
            <div className="flex justify-center gap-2">
              {weekDots.map((on, i) => (
                <span
                  key={i}
                  className={`w-3 h-3 rounded-full ${on ? 'bg-[#F5A623]' : 'bg-gray-200'}`}
                />
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <p className="text-3xl mb-2">📜</p>
            <h2 className="font-bold text-navy mb-1">Certificates</h2>
            <p className="text-2xl font-extrabold text-teal mb-3">{certificates.length}</p>
            <Link to="/discoverer/certificates" className="text-teal font-extrabold text-sm">
              View →
            </Link>
          </div>
        </div>
      </div>
    </DiscovererPageShell>
  )
}
