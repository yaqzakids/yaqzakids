import { useEffect, useState } from 'react'
import DiscovererPageShell from '@/components/discoverer/DiscovererPageShell'
import LoadingSpinner from '@/components/LoadingSpinner'
import BadgeHexagon from '@/components/discoverer/BadgeHexagon'
import BadgeDetailModal from '@/components/discoverer/BadgeDetailModal'
import { useSelectedChild } from '@/context/SelectedChildContext'
import { fetchChildBadgesWithStatus, DISCOVERER_BADGE_DISPLAY } from '@/lib/discoverer'
import type { DiscovererBadgeDisplay } from '@/lib/discoverer'

const CATEGORIES = [
  { id: 'reading', label: 'Reading Badges' },
  { id: 'quiz', label: 'Quiz Badges' },
  { id: 'reflection', label: 'Reflection Badges' },
  { id: 'path', label: 'Path Badges' },
  { id: 'streak', label: 'Streak Badges' },
  { id: 'special', label: 'Special Badges' },
] as const

export default function BadgesPage() {
  const { selectedChild, loading: childLoading } = useSelectedChild()
  const [loading, setLoading] = useState(true)
  const [earnedSlugs, setEarnedSlugs] = useState<Set<string>>(new Set())
  const [selectedBadge, setSelectedBadge] = useState<DiscovererBadgeDisplay | null>(null)

  useEffect(() => {
    if (childLoading) return
    if (!selectedChild) {
      setLoading(false)
      return
    }
    fetchChildBadgesWithStatus(selectedChild.id)
      .then((badges) => {
        setEarnedSlugs(new Set(badges.filter((b) => b.earned).map((b) => b.slug)))
      })
      .finally(() => setLoading(false))
  }, [selectedChild?.id, childLoading])

  if (childLoading || loading) {
    return (
      <DiscovererPageShell backFallback="/discoverer">
        <div className="py-24 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </DiscovererPageShell>
    )
  }

  return (
    <DiscovererPageShell
      backFallback="/discoverer"
      breadcrumbs={[
        { label: 'Home', to: '/discoverer' },
        { label: 'Badges' },
      ]}
    >
      <BadgeDetailModal
        badge={selectedBadge}
        earned={selectedBadge ? earnedSlugs.has(selectedBadge.slug) : false}
        onClose={() => setSelectedBadge(null)}
      />
      <div className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="font-display text-3xl font-bold text-navy mb-2">My Badges</h1>
        <p className="text-muted mb-10">Earn badges by reading, quizzing, reflecting, and completing paths.</p>

        {CATEGORIES.map((cat) => (
          <section key={cat.id} className="mb-10">
            <h2 className="font-bold text-navy text-lg mb-5">{cat.label}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {DISCOVERER_BADGE_DISPLAY.map((b) => {
                const earned = earnedSlugs.has(b.slug)
                return (
                  <div
                    key={`${cat.id}-${b.slug}`}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col items-center text-center"
                  >
                    <BadgeHexagon
                      icon={b.icon}
                      name={b.name}
                      color={b.color}
                      earned={earned}
                      onClick={() => setSelectedBadge(b)}
                    />
                    {!earned && (
                      <p className="text-xs text-muted mt-3">{b.requirement}</p>
                    )}
                    {earned && (
                      <p className="text-xs text-teal font-bold mt-3">Earned</p>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </DiscovererPageShell>
  )
}
