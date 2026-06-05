import type { AgeGroup, ChildProfile } from '../../lib/types'
import { LEVEL_XP_THRESHOLD } from '../../lib/constants'

interface ChildCardProps {
  child: ChildProfile
  onViewProgress?: (childId: string) => void
}

const ageGroupColors: Record<AgeGroup, string> = {
  explorer: 'bg-green-100 text-green-700',
  discoverer: 'bg-amber-100 text-amber-700',
  thinker: 'bg-purple-100 text-purple-700',
}

export default function ChildCard({ child, onViewProgress }: ChildCardProps) {
  const xpInLevel = child.xp_points % LEVEL_XP_THRESHOLD
  const progressPercent = (xpInLevel / LEVEL_XP_THRESHOLD) * 100

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-display text-lg font-bold text-navy">{child.name}</h3>
        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full capitalize ${ageGroupColors[child.age_group]}`}>
          {child.age_group}
        </span>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-xs text-muted mb-1">
          <span>Level {child.level}</span>
          <span>{child.xp_points} XP</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-teal rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <p className="text-sm text-muted mb-1">🔥 {child.streak_days} day streak</p>
      {child.last_active_date && (
        <p className="text-xs text-[#9CA3AF] mb-3">Last active: {child.last_active_date}</p>
      )}

      <button
        onClick={() => onViewProgress?.(child.id)}
        className="text-teal text-sm font-bold hover:opacity-80 transition-opacity"
      >
        View Progress →
      </button>
    </div>
  )
}
