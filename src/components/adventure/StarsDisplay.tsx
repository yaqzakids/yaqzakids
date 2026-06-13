import { useEffect, useState } from 'react'
import { fetchChildPoints } from '@/lib/adventure/service'

interface StarsDisplayProps {
  childId: string | null
  className?: string
}

export default function StarsDisplay({ childId, className = '' }: StarsDisplayProps) {
  const [points, setPoints] = useState(0)

  useEffect(() => {
    if (!childId) {
      setPoints(0)
      return
    }
    fetchChildPoints(childId).then(setPoints)
  }, [childId])

  return (
    <div className={`inline-flex items-center gap-2 bg-[#FEF3C7] text-[#D4820A] px-4 py-2 rounded-full font-extrabold text-sm shadow-sm ${className}`}>
      <span className="text-lg">⭐</span>
      <span>{points.toLocaleString()} Stars</span>
    </div>
  )
}
