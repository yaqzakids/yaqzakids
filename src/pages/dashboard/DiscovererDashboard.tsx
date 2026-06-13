import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DiscovererPageShell from '@/components/discoverer/DiscovererPageShell'
import LoadingSpinner from '@/components/LoadingSpinner'
import DiscovererProgressSnapshot from '@/components/discoverer/DiscovererProgressSnapshot'
import TealProgressBar from '@/components/discoverer/TealProgressBar'
import { useSelectedChild } from '@/context/SelectedChildContext'
import {
  fetchChildStats,
  fetchDiscovererHomepageData,
  fetchChildCertificates,
  fetchDailyMission,
} from '@/lib/discoverer'
import type { Certificate } from '@/lib/types'
import type { AdventureArticle, PathWithProgress } from '@/lib/adventure/types'
import { useAuth } from '@/components/ProtectedRoute'

/** Full dashboard at /discoverer/dashboard */
export default function DiscovererDashboard() {
  const { user } = useAuth()
  const { selectedChild, loading: childLoading } = useSelectedChild()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Awaited<ReturnType<typeof fetchChildStats>> | null>(null)
  const [paths, setPaths] = useState<PathWithProgress[]>([])
  const [recommended, setRecommended] = useState<AdventureArticle[]>([])
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [missionDone, setMissionDone] = useState({ read: false, quiz: false, reflection: false })
  const [earnedBadgeSlugs, setEarnedBadgeSlugs] = useState<Set<string>>(new Set())

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
      fetchDailyMission(selectedChild.id),
    ])
      .then(([s, home, certs, mission]) => {
        if (cancelled) return
        setStats(s)
        setPaths(home.continuePaths)
        setRecommended(home.recommendedArticles)
        setCertificates(certs)
        setMissionDone({
          read: mission.readStory,
          quiz: mission.passQuiz,
          reflection: mission.answerReflection,
        })
        setEarnedBadgeSlugs(new Set(home.badges.filter((b) => b.earned).map((b) => b.slug)))
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

  return (
    <DiscovererPageShell backFallback="/discoverer" homeTo="/discoverer">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-10">
        <div className="mb-6">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-navy">My Dashboard</h1>
          <p className="text-muted text-sm mt-1">Your full progress overview</p>
        </div>

        <DiscovererProgressSnapshot
          childName={selectedChild.name}
          avatarId={selectedChild.avatar_id ?? null}
          levelLabel={stats?.level ?? 'Seeker'}
          xp={stats?.xp ?? 0}
          starsToNext={stats?.starsToNext ?? 100}
          streak={stats?.streak ?? 0}
          paths={paths}
          certificateCount={certificates.length}
          missionDone={missionDone}
          earnedBadgeSlugs={earnedBadgeSlugs}
        />

        {paths[0] && (
          <section className="mt-10 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
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
          </section>
        )}

        <section className="mt-10 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
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
        </section>
      </div>
    </DiscovererPageShell>
  )
}
