import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DiscovererPageShell from '@/components/discoverer/DiscovererPageShell'
import LoadingSpinner from '@/components/LoadingSpinner'
import TealProgressBar from '@/components/discoverer/TealProgressBar'
import { useSelectedChild } from '@/context/SelectedChildContext'
import { fetchChildStats, nextStarMilestone } from '@/lib/discoverer'

const REWARDS = [
  { stars: 100, label: 'Star Reader badge progress', icon: '⭐' },
  { stars: 300, label: 'Unlock Nature Helper badge', icon: '🌿' },
  { stars: 600, label: 'Bonus hero card', icon: '🃏' },
  { stars: 1000, label: 'Discoverer Level up', icon: '🏆' },
]

export default function RewardsPage() {
  const { selectedChild, loading: childLoading } = useSelectedChild()
  const [loading, setLoading] = useState(true)
  const [stars, setStars] = useState(0)

  useEffect(() => {
    if (childLoading) return
    if (!selectedChild) {
      setLoading(false)
      return
    }
    fetchChildStats(selectedChild.id)
      .then((s) => setStars(s.stars))
      .finally(() => setLoading(false))
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
        <div className="max-w-lg mx-auto py-24 text-center px-6">
          <p className="font-bold text-navy mb-4">Sign in to see your rewards.</p>
          <Link to="/login" className="text-teal font-extrabold">Sign in →</Link>
        </div>
      </DiscovererPageShell>
    )
  }

  const nextMilestone = nextStarMilestone(stars)
  const progressToNext = nextMilestone > 0 ? Math.round((stars / nextMilestone) * 100) : 100

  return (
    <DiscovererPageShell>
      <div className="max-w-lg mx-auto px-6 py-12">
        <h1 className="font-display text-3xl font-bold text-[#1B2F5E] mb-2 text-center">
          Your Stars ⭐
        </h1>
        <p className="text-[#6B7280] text-center mb-8">Earn stars by reading, quizzing, and reflecting.</p>

        <div className="bg-white rounded-2xl shadow-sm p-8 text-center mb-6">
          <p className="text-5xl font-extrabold text-[#F5A623] mb-1">{stars.toLocaleString()}</p>
          <p className="font-bold text-[#1B2F5E]">Stars earned</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <p className="text-sm font-bold text-[#1B2F5E] mb-1">Next reward at {nextMilestone} stars</p>
          <TealProgressBar value={progressToNext} showLabel className="mb-2" />
          <p className="text-xs text-[#6B7280]">
            {nextMilestone - stars} stars to go
          </p>
        </div>

        <div className="space-y-3">
          <p className="font-bold text-[#1B2F5E] mb-2">Upcoming rewards</p>
          {REWARDS.map((r) => (
            <div
              key={r.stars}
              className={`flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border ${
                stars >= r.stars ? 'border-[#2AAFA0]/30 opacity-70' : 'border-transparent'
              }`}
            >
              <span className="text-2xl">{r.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-bold text-[#1B2F5E]">{r.label}</p>
                <p className="text-xs text-[#6B7280]">{r.stars} stars</p>
              </div>
              {stars >= r.stars && <span className="text-[#2AAFA0] font-bold text-sm">✓</span>}
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link to="/discoverer/explore" className="text-[#2AAFA0] font-extrabold text-sm">
            Read a story to earn more →
          </Link>
        </div>
      </div>
    </DiscovererPageShell>
  )
}
