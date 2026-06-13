import BadgeHexagon from '@/components/discoverer/BadgeHexagon'
import type { DiscovererBadgeDisplay } from '@/lib/discoverer'

interface BadgeDetailModalProps {
  badge: DiscovererBadgeDisplay | null
  earned?: boolean
  onClose: () => void
}

export default function BadgeDetailModal({ badge, earned = false, onClose }: BadgeDetailModalProps) {
  if (!badge) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-8 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <BadgeHexagon icon={badge.icon} name={badge.name} color={badge.color} earned={earned} />
        <p className="text-sm text-[#6B7280] leading-relaxed mt-4 mb-4">{badge.description}</p>
        <div className="bg-[#EEF4FF] rounded-xl p-4 text-left mb-5">
          <p className="text-xs font-extrabold text-[#2AAFA0] uppercase mb-1">How to earn</p>
          <p className="text-sm text-[#1B2F5E]">{badge.requirement}</p>
        </div>
        <p className="text-xs font-bold mb-4">
          {earned ? (
            <span className="text-[#2AAFA0]">✓ Earned</span>
          ) : (
            <span className="text-[#6B7280]">Keep going — you&apos;re on your way!</span>
          )}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2.5 bg-[#1B2F5E] text-white rounded-full text-sm font-extrabold"
        >
          Got it!
        </button>
      </div>
    </div>
  )
}
