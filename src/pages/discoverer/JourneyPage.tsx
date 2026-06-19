import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DiscovererPageShell from '@/components/discoverer/DiscovererPageShell'
import LoadingSpinner from '@/components/LoadingSpinner'
import TealProgressBar from '@/components/discoverer/TealProgressBar'
import { useAuth } from '@/components/ProtectedRoute'
import { useSelectedChild } from '@/context/SelectedChildContext'
import {
  fetchChildStats,
  fetchDiscovererHomepageData,
  fetchChildCertificates,
  fetchLastUnfinishedArticle,
  type LastUnfinishedArticle,
} from '@/lib/discoverer'
import { learningPathDetailUrl } from '@/lib/learningPaths'
import type { Certificate } from '@/lib/types'
import type { PathWithProgress } from '@/lib/adventure/types'

export default function JourneyPage() {
  const { user } = useAuth()
  const { selectedChild, loading: childLoading } = useSelectedChild()
  const [loading, setLoading] = useState(true)
  const [paths, setPaths] = useState<PathWithProgress[]>([])
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [lastArticle, setLastArticle] = useState<LastUnfinishedArticle | null>(null)
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    if (childLoading || !selectedChild) return
    let cancelled = false
    setLoading(true)
    Promise.all([
      fetchDiscovererHomepageData(selectedChild.id, user?.id ?? null, selectedChild.name),
      fetchChildStats(selectedChild.id),
      fetchChildCertificates(selectedChild.id),
      fetchLastUnfinishedArticle(selectedChild.id),
    ])
      .then(([home, stats, certs, last]) => {
        if (cancelled) return
        setPaths(home.continuePaths)
        setStreak(stats.streak)
        setCertificates(certs)
        setLastArticle(last)
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
        <div className="py-24 flex justify-center"><LoadingSpinner size="lg" /></div>
      </DiscovererPageShell>
    )
  }

  if (!selectedChild) {
    return (
      <DiscovererPageShell>
        <div className="max-w-lg mx-auto py-24 px-6 text-center">
          <p className="text-navy font-bold mb-4">Sign in and select a child profile to view your journey.</p>
          <Link to="/login" className="text-teal font-extrabold hover:underline">Sign in →</Link>
        </div>
      </DiscovererPageShell>
    )
  }

  return (
    <DiscovererPageShell>
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-10">
        <h1 className="font-display text-3xl font-bold text-navy mb-2">My Journey</h1>
        <p className="text-muted mb-8">Your paths, streaks, and progress in one place.</p>

        <div className="grid md:grid-cols-3 gap-4 mb-10">
          <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
            <p className="text-3xl mb-1">🔥</p>
            <p className="text-2xl font-extrabold text-gold">{streak}</p>
            <p className="text-sm font-bold text-navy">Day Streak</p>
            <Link to="/discoverer/streaks" className="text-teal text-xs font-extrabold mt-2 inline-block">
              View streak →
            </Link>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
            <p className="text-3xl mb-1">🏆</p>
            <p className="text-2xl font-extrabold text-navy">{certificates.length}</p>
            <p className="text-sm font-bold text-navy">Certificates</p>
            <Link to="/discoverer/certificates" className="text-teal text-xs font-extrabold mt-2 inline-block">
              View all →
            </Link>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="font-bold text-navy text-sm mb-2">Continue reading</p>
            {lastArticle ? (
              <>
                <p className="text-sm text-navy line-clamp-2 mb-2">{lastArticle.title}</p>
                <Link to={lastArticle.url} className="text-teal text-sm font-extrabold">
                  Resume →
                </Link>
              </>
            ) : (
              <Link to="/discoverer/explore" className="text-teal text-sm font-extrabold">
                Pick a story →
              </Link>
            )}
          </div>
        </div>

        <h2 className="font-display text-xl font-bold text-navy mb-4">Learning Paths</h2>
        {paths.length === 0 ? (
          <p className="text-muted mb-6">Start a path from Explore to begin your journey.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paths.map((p) => (
              <Link
                key={p.id}
                to={learningPathDetailUrl(p.slug)}
                className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="font-bold text-navy mb-2">{p.title}</h3>
                <TealProgressBar value={p.path_progress?.completion_percentage ?? 0} showLabel />
              </Link>
            ))}
          </div>
        )}
        <Link to="/paths" className="inline-block mt-6 text-teal font-extrabold hover:underline">
          Browse all paths →
        </Link>
      </div>
    </DiscovererPageShell>
  )
}
