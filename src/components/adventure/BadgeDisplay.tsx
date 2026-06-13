import { useEffect, useState } from 'react'
import { fetchAllBadges, fetchChildBadges } from '@/lib/adventure/service'
import type { Badge, ChildBadge } from '@/lib/adventure/types'
import LoadingSpinner from '@/components/LoadingSpinner'

interface BadgeDisplayProps {
  childId: string | null
}

export default function BadgeDisplay({ childId }: BadgeDisplayProps) {
  const [allBadges, setAllBadges] = useState<Badge[]>([])
  const [earned, setEarned] = useState<ChildBadge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchAllBadges(), childId ? fetchChildBadges(childId) : Promise.resolve([])])
      .then(([badges, childBadges]) => {
        setAllBadges(badges)
        setEarned(childBadges)
      })
      .finally(() => setLoading(false))
  }, [childId])

  if (loading) return <LoadingSpinner size="sm" />

  const earnedIds = new Set(earned.map((b) => b.badge_id))

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {allBadges.map((badge) => {
        const isEarned = earnedIds.has(badge.id)
        return (
          <div
            key={badge.id}
            className={`rounded-2xl p-4 text-center border-2 transition-all ${
              isEarned
                ? 'bg-[#FEF3C7] border-gold shadow-md'
                : 'bg-gray-50 border-gray-200 opacity-60 grayscale'
            }`}
          >
            <div className="text-3xl mb-2">{isEarned ? (badge.icon ?? '🏅') : '🔒'}</div>
            <p className="font-bold text-navy text-sm">{badge.name}</p>
            <p className="text-xs text-muted mt-1">{badge.description}</p>
          </div>
        )
      })}
    </div>
  )
}
