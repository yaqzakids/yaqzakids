import { useEffect, useState } from 'react'
import { useSelectedChild } from '@/context/SelectedChildContext'
import { fetchChildStarsTotal, fetchChildStreak } from '@/lib/adventure/engagement'

/** Navbar stars + streak for the actively selected child */
export default function NavbarEngagement() {
  const { selectedChild } = useSelectedChild()
  const [stars, setStars] = useState(0)
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    if (!selectedChild) {
      setStars(0)
      setStreak(0)
      return
    }
    let cancelled = false
    Promise.all([
      fetchChildStarsTotal(selectedChild.id),
      fetchChildStreak(selectedChild.id),
    ]).then(([total, streakRow]) => {
      if (!cancelled) {
        setStars(total)
        setStreak(streakRow?.current_streak ?? 0)
      }
    })
    return () => { cancelled = true }
  }, [selectedChild?.id])

  if (!selectedChild) return null

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-bold text-navy hidden sm:inline">{selectedChild.name}</span>
      <span
        className="text-sm whitespace-nowrap"
        style={{ color: '#F5A623', fontFamily: 'Nunito, sans-serif', fontWeight: 800 }}
      >
        ⭐ {stars.toLocaleString()}
      </span>
      <span className="text-sm font-extrabold text-navy whitespace-nowrap">
        🔥 {streak}
      </span>
    </div>
  )
}
