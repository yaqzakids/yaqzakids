import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../components/ProtectedRoute'
import { getChildProfiles, getRecentProgress } from '../lib/supabase'
import { fetchChildStreak } from '../lib/adventure/engagement'
import type { ChildProfile, Progress } from '../lib/types'
import XPProgress from '../components/dashboard/XPProgress'
import MissionCard from '../components/dashboard/MissionCard'
import LoadingSpinner from '../components/LoadingSpinner'

export default function ChildDashboard() {
  const { user, loading: authLoading } = useAuth()
  const [searchParams] = useSearchParams()
  const childId = searchParams.get('child')
  const [child, setChild] = useState<ChildProfile | null>(null)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [activity, setActivity] = useState<Progress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || authLoading) return

    const load = async () => {
      const children = await getChildProfiles(user.id)
      const selected = childId
        ? children.find((c) => c.id === childId) ?? children[0]
        : children[0]

      if (selected) {
        setChild(selected)
        const [prog, streakRow] = await Promise.all([
          getRecentProgress([selected.id], 10),
          fetchChildStreak(selected.id),
        ])
        setActivity(prog)
        setCurrentStreak(streakRow?.current_streak ?? 0)
      }
      setLoading(false)
    }
    load()
  }, [user, authLoading, childId])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!child) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted mb-4">No child profile found.</p>
          <Link to="/parent/dashboard" className="text-teal font-bold">Go to Dashboard →</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg page-transition">
      <nav className="bg-white border-b border-gray-200 px-6 md:px-10 h-16 flex items-center justify-end">
        <Link to="/parent/dashboard" className="text-sm text-teal font-bold">← Back to Dashboard</Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 md:px-10 py-10">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center text-3xl">
              {child.age_group === 'explorer' ? '🌱' : child.age_group === 'discoverer' ? '🔍' : '🌍'}
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-navy">{child.name}</h1>
              <p className="text-muted capitalize">{child.age_group} · Level {child.level}</p>
            </div>
          </div>
          <XPProgress xpPoints={child.xp_points} level={child.level} />
          <div className="grid grid-cols-3 gap-4 mt-6 text-center">
            <div>
              <p className="text-2xl font-extrabold text-gold">{currentStreak}</p>
              <p className="text-xs text-muted">🔥 Day Streak</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-teal">{child.total_articles_read}</p>
              <p className="text-xs text-muted">Articles Read</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-purple">{child.total_quizzes_completed}</p>
              <p className="text-xs text-muted">Quizzes Done</p>
            </div>
          </div>
        </div>

        <MissionCard
          title="Read today's featured story"
          xpReward={child.age_group === 'explorer' ? 10 : child.age_group === 'discoverer' ? 25 : 50}
          date={new Date().toLocaleDateString()}
        />

        <Link
          to="/adventures"
          className="mt-6 block bg-gradient-to-r from-gold to-teal text-white rounded-2xl p-6 text-center shadow-lg hover:opacity-95 transition-opacity"
        >
          <p className="text-3xl mb-2">🗺️</p>
          <p className="font-display text-xl font-bold">Adventure Paths</p>
          <p className="text-sm text-white/90 mt-1">Explore paths, earn Stars, collect badges & hero cards</p>
        </Link>

        <section className="mt-8">
          <h2 className="font-display text-xl font-bold text-navy mb-4">Recent Activity</h2>
          {activity.length === 0 ? (
            <p className="text-muted text-center py-6 bg-white rounded-2xl border border-gray-200">No activity yet. Start reading!</p>
          ) : (
            <div className="space-y-3">
              {activity.map((item) => (
                <div key={item.id} className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-navy text-sm">{(item.article as { title?: string })?.title ?? 'Article'}</p>
                    <p className="text-xs text-muted">
                      {item.completed_date
                        ? new Date(item.completed_date).toLocaleDateString()
                        : ''}
                    </p>
                  </div>
                  <span className="text-teal font-extrabold text-sm">✓ Complete</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {child.badges.length > 0 && (
          <section className="mt-8">
            <h2 className="font-display text-xl font-bold text-navy mb-4">Badges 🎖️</h2>
            <div className="flex flex-wrap gap-2">
              {child.badges.map((badge) => (
                <span key={badge} className="bg-purple/10 text-purple px-3 py-1 rounded-full text-sm font-bold">{badge}</span>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
