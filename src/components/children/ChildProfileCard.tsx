import UserAvatar from '@/components/UserAvatar'
import { AGE_GROUP_META, type ChildProfileSummary } from '@/lib/childProfiles'

interface ChildProfileCardProps {
  summary: ChildProfileSummary
  onEnter: (childId: string) => void
  onEdit?: (childId: string) => void
  isActive?: boolean
}

export default function ChildProfileCard({ summary, onEnter, onEdit, isActive }: ChildProfileCardProps) {
  const meta = AGE_GROUP_META[summary.ageGroup]

  return (
    <div
      className={`w-full bg-white rounded-2xl shadow-[0_4px_24px_rgba(27,47,94,0.08)] border-2 transition-all hover:-translate-y-0.5 hover:shadow-lg ${
        isActive ? 'border-[#2AAFA0] ring-2 ring-[#2AAFA0]/20' : 'border-white'
      }`}
    >
      <button type="button" onClick={() => onEnter(summary.childId)} className="w-full text-left p-6 pb-4">
        <div className="flex items-start gap-4 mb-5">
          <UserAvatar name={summary.name} avatarId={summary.avatarId} size={64} />
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-xl font-bold text-[#1B2F5E] truncate">{summary.name}</h2>
            <p className="text-sm font-bold mt-0.5" style={{ color: meta.accent }}>
              {meta.emoji} {meta.label}
              {summary.age != null ? ` · Age ${summary.age}` : ''} · Ages {meta.ages}
            </p>
            <p className="text-xs text-[#6B7280] mt-1">
              Level {summary.levelNumber} · {summary.levelName}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-[#FFF8ED] rounded-xl px-3 py-2.5 text-center">
            <p className="text-lg font-extrabold text-[#F5A623]">⭐ {summary.stars.toLocaleString()}</p>
            <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wide">Stars</p>
          </div>
          <div className="bg-[#EEF4FF] rounded-xl px-3 py-2.5 text-center">
            <p className="text-lg font-extrabold text-[#F5A623]">🔥 {summary.streak}</p>
            <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wide">Day Streak</p>
          </div>
        </div>

        <div className="bg-[#EEF4FF]/60 rounded-xl px-4 py-3 mb-5">
          <p className="text-[10px] font-extrabold text-[#2AAFA0] uppercase tracking-wide mb-1">
            Current path
          </p>
          <p className="text-sm font-semibold text-[#1B2F5E] line-clamp-2">{summary.lastActiveLabel}</p>
        </div>

        <span
          className="inline-flex w-full items-center justify-center gap-2 px-5 py-3 rounded-full font-extrabold text-white text-sm"
          style={{ background: meta.accent }}
        >
          Continue →
        </span>
      </button>
      {onEdit && (
        <div className="px-6 pb-5 pt-0">
          <button
            type="button"
            onClick={() => onEdit(summary.childId)}
            className="text-sm font-bold text-[#6B7280] hover:text-[#2AAFA0]"
          >
            Edit profile
          </button>
        </div>
      )}
    </div>
  )
}
