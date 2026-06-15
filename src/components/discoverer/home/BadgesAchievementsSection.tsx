import { Link } from 'react-router-dom'
import BadgeHexagon from '@/components/discoverer/BadgeHexagon'
import { DISCOVERER_BADGE_DISPLAY, type DiscovererBadgeDisplay } from '@/lib/discoverer'

export default function BadgesAchievementsSection({
  earnedBadgeSlugs,
  certificateCount,
  onBadgeClick,
}: {
  earnedBadgeSlugs: Set<string>
  certificateCount: number
  onBadgeClick?: (badge: DiscovererBadgeDisplay) => void
}) {
  const earnedBadges = DISCOVERER_BADGE_DISPLAY.filter((b) => earnedBadgeSlugs.has(b.slug))
  const displayBadges = earnedBadges.length > 0 ? earnedBadges.slice(0, 4) : DISCOVERER_BADGE_DISPLAY.slice(0, 4)

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="font-display text-xl font-bold text-[#1B2F5E]">🏆 Badges & Achievements</h2>
        <Link to="/discoverer/badges" className="text-[#2AAFA0] text-sm font-extrabold">
          View all →
        </Link>
      </div>
      <p className="text-sm text-[#6B7280] mb-6">
        Celebrate your progress — badges, certificates, and milestones along your journey.
      </p>

      <div className="grid md:grid-cols-[1fr_auto] gap-5">
        <div className="bg-white rounded-2xl border border-[#E2EBF8] p-5 shadow-sm">
          <p className="text-xs font-extrabold text-[#6B7280] uppercase tracking-wide mb-4">
            {earnedBadges.length > 0 ? 'Recent badges' : 'Badges to earn'}
          </p>
          <div className="flex gap-4 overflow-x-auto pb-1">
            {displayBadges.map((b) =>
              onBadgeClick ? (
                <button
                  key={b.slug}
                  type="button"
                  onClick={() => onBadgeClick(b)}
                  className="shrink-0 bg-transparent border-0 p-0 cursor-pointer"
                >
                  <BadgeHexagon
                    icon={b.icon}
                    name={b.name}
                    color={b.color}
                    earned={earnedBadgeSlugs.has(b.slug)}
                    size="sm"
                  />
                </button>
              ) : (
                <Link key={b.slug} to="/discoverer/badges" className="shrink-0">
                  <BadgeHexagon
                    icon={b.icon}
                    name={b.name}
                    color={b.color}
                    earned={earnedBadgeSlugs.has(b.slug)}
                    size="sm"
                  />
                </Link>
              )
            )}
          </div>
        </div>

        <Link
          to="/discoverer/certificates"
          className="bg-white rounded-2xl border border-[#E2EBF8] p-5 shadow-sm hover:shadow-md transition-shadow min-w-[200px] flex flex-col justify-center text-center"
        >
          <p className="text-3xl mb-2" aria-hidden>
            📜
          </p>
          <p className="font-bold text-[#1B2F5E] mb-1">Certificates</p>
          <p className="text-2xl font-extrabold text-[#2AAFA0] mb-2">{certificateCount}</p>
          <span className="text-[#2AAFA0] text-sm font-extrabold">View →</span>
        </Link>
      </div>
    </section>
  )
}
