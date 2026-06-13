import type { AgeGroup, ChildProfile } from '@/lib/types'
import type { ChildDashboardAnalytics } from '@/lib/adventure/types'
import { getLevelProgress } from '@/lib/adventure/levels'
import { Link } from 'react-router-dom'
import UserAvatar from '@/components/UserAvatar'

interface ChildAnalyticsCardProps {
  child: ChildProfile
  analytics: ChildDashboardAnalytics
}

const ageBadgeStyles: Record<AgeGroup, string> = {
  explorer: 'bg-gold/15 text-[#D4820A]',
  discoverer: 'bg-teal/15 text-teal',
  thinker: 'bg-purple/15 text-purple',
}

function formatLastActive(date: string | null): string {
  if (!date) return 'Never'
  const d = new Date(date + 'T00:00:00')
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ChildAnalyticsCard({ child, analytics }: ChildAnalyticsCardProps) {
  const level = getLevelProgress(analytics.totalStars)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-start gap-6">
        {/* Left — identity */}
        <div className="flex items-center gap-4 md:w-1/3 shrink-0">
          <UserAvatar
            name={child.name}
            avatarId={child.avatar_id}
            size={56}
          />
          <div>
            <h3 className="font-display text-xl font-bold text-navy">{child.name}</h3>
            <span className={`inline-block mt-1 text-xs font-extrabold px-2.5 py-0.5 rounded-full capitalize ${ageBadgeStyles[child.age_group]}`}>
              {child.age_group}
            </span>
          </div>
        </div>

        {/* Right — stats grid */}
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCell icon="⭐" label="Total Stars" value={analytics.totalStars.toLocaleString()} />
          <StatCell icon="🔥" label="Current Streak" value={String(analytics.currentStreak)} />
          <StatCell icon="📚" label="Articles Completed" value={String(analytics.articlesCompleted)} />
          <StatCell icon="✅" label="Quizzes Passed" value={String(analytics.quizzesPassed)} />
          <StatCell icon="🏅" label="Badges Earned" value={String(analytics.badgesEarned)} />
          <StatCell icon="📅" label="Last Active" value={formatLastActive(analytics.lastActive)} small />
        </div>
      </div>

      {!analytics.hasActivity ? (
        <p className="mt-5 text-center text-muted text-sm py-4 bg-bg rounded-xl">
          No learning activity yet. Start an adventure!
        </p>
      ) : (
        <>
          {/* Level progress */}
          <div className="mt-5 pt-5 border-t border-gray-100">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
              <span className="font-bold text-navy text-sm">
                Level: {level.currentLevel}
                {level.nextLevel && (
                  <span className="text-muted font-normal"> → {level.nextLevel}</span>
                )}
              </span>
              {level.nextLevel && (
                <span className="text-xs text-muted font-bold">
                  {level.starsToNext.toLocaleString()} ⭐ to next level
                </span>
              )}
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gold rounded-full transition-all"
                style={{ width: `${level.progressPercent}%` }}
              />
            </div>
          </div>

          {/* Most active pillar */}
          {analytics.mostActivePillar && (
            <p className="mt-4 text-sm text-muted">
              <span className="font-bold text-navy">Most Active Pillar:</span>{' '}
              {analytics.mostActivePillar}
            </p>
          )}
        </>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          to={`/children/${child.id}/edit`}
          className="text-gold text-sm font-bold hover:opacity-80 no-underline"
        >
          Edit Profile →
        </Link>
        <Link
          to="/adventures"
          className="text-teal text-sm font-bold hover:opacity-80"
        >
          Adventures →
        </Link>
        <Link
          to={`/child-dashboard?child=${child.id}`}
          className="text-navy text-sm font-bold hover:opacity-80"
        >
          Child Dashboard →
        </Link>
      </div>
    </div>
  )
}

function StatCell({ icon, label, value, small }: { icon: string; label: string; value: string; small?: boolean }) {
  return (
    <div className="bg-bg rounded-xl p-3 text-center">
      <p className="text-lg">{icon}</p>
      <p className={`font-extrabold text-navy ${small ? 'text-xs' : 'text-lg'}`}>{value}</p>
      <p className="text-[10px] text-muted font-bold uppercase tracking-wide mt-0.5">{label}</p>
    </div>
  )
}
