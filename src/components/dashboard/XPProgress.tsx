import { LEVEL_XP_THRESHOLD } from '../../lib/constants'

interface XPProgressProps {
  xpPoints: number
  level: number
}

export default function XPProgress({ xpPoints, level }: XPProgressProps) {
  const xpInLevel = xpPoints % LEVEL_XP_THRESHOLD
  const progressPercent = (xpInLevel / LEVEL_XP_THRESHOLD) * 100

  return (
    <div>
      <div className="flex justify-between text-sm font-bold text-navy mb-2">
        <span>Level {level}</span>
        <span className="text-gold">{xpPoints} XP</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-gold to-teal rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <p className="text-xs text-muted mt-1">{LEVEL_XP_THRESHOLD - xpInLevel} XP to next level</p>
    </div>
  )
}
