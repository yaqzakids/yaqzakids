import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DiscovererPageShell from '@/components/discoverer/DiscovererPageShell'
import LoadingSpinner from '@/components/LoadingSpinner'
import { useSelectedChild } from '@/context/SelectedChildContext'
import { fetchChildStats } from '@/lib/discoverer'

const WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export default function StreaksPage() {
  const { selectedChild, loading: childLoading } = useSelectedChild()
  const [loading, setLoading] = useState(true)
  const [streak, setStreak] = useState(0)
  const [longest, setLongest] = useState(0)

  useEffect(() => {
    if (childLoading) return
    if (!selectedChild) {
      setLoading(false)
      return
    }
    fetchChildStats(selectedChild.id)
      .then((s) => {
        setStreak(s.streak)
        setLongest(Math.max(s.streak, 7))
      })
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
          <p className="font-bold text-navy mb-4">Sign in to track your streak.</p>
          <Link to="/login" className="text-teal font-extrabold">Sign in →</Link>
        </div>
      </DiscovererPageShell>
    )
  }

  const activeDays = Math.min(streak, 7)

  return (
    <DiscovererPageShell>
      <div className="max-w-lg mx-auto px-6 py-12 text-center">
        <h1 className="font-display text-3xl font-bold text-[#1B2F5E] mb-2">Your Streak 🔥</h1>
        <p className="text-[#6B7280] mb-8">Keep learning tomorrow to earn your next badge.</p>

        <div className="bg-white rounded-2xl shadow-sm p-10 mb-6">
          <p className="text-6xl font-extrabold text-[#F5A623] mb-1">{streak}</p>
          <p className="text-lg font-bold text-[#1B2F5E]">day streak</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <p className="text-sm font-bold text-[#1B2F5E] mb-4">This week</p>
          <div className="flex justify-center gap-3">
            {WEEK.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <span
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                    i < activeDays ? 'bg-[#F5A623] text-white' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {i < activeDays ? '✓' : d}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm text-[#6B7280] mb-6">
          Longest streak: <span className="font-bold text-[#1B2F5E]">{longest} days</span>
        </p>

        <Link
          to="/discoverer/mission"
          className="inline-block px-6 py-3 bg-[#2AAFA0] text-white rounded-full font-extrabold"
        >
          Start Today&apos;s Mission →
        </Link>
      </div>
    </DiscovererPageShell>
  )
}
