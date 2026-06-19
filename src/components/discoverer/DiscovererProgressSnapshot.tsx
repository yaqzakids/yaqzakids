import { Link } from 'react-router-dom'
import { learningPathDetailUrl } from '@/lib/learningPaths'
import UserAvatar from '@/components/UserAvatar'
import BadgeHexagon from '@/components/discoverer/BadgeHexagon'
import TealProgressBar from '@/components/discoverer/TealProgressBar'
import { DISCOVERER_BADGE_DISPLAY } from '@/lib/discoverer'
import type { PathWithProgress } from '@/lib/adventure/types'

export interface DiscovererProgressSnapshotProps {
  childName: string
  avatarId: string | null
  levelLabel: string
  xp: number
  starsToNext: number
  streak: number
  paths: PathWithProgress[]
  certificateCount: number
  missionDone?: { read: boolean; quiz: boolean; reflection: boolean }
  earnedBadgeSlugs?: Set<string>
}

/**
 * Compact progress dashboard extracted from DiscovererDashboard.
 * Used on /discoverer below the signed-in hero.
 */
export default function DiscovererProgressSnapshot({
  childName,
  avatarId,
  levelLabel,
  xp,
  starsToNext,
  streak,
  paths,
  certificateCount,
  missionDone = { read: false, quiz: false, reflection: false },
  earnedBadgeSlugs = new Set(),
}: DiscovererProgressSnapshotProps) {
  const weekDots = Array.from({ length: 7 }, (_, i) => i < Math.min(streak, 7))
  const hasStreak = streak > 0
  const hasCertificates = certificateCount > 0
  const hasPaths = paths.length > 0

  return (
    <section className="pt-6 pb-2" aria-labelledby="discoverer-progress-snapshot">
      <div className="flex items-end justify-between gap-4 mb-4">
        <h2 id="discoverer-progress-snapshot" className="font-display text-xl md:text-2xl font-bold text-[#1B2F5E]">
          My Progress Snapshot
        </h2>
        <Link to="/discoverer/dashboard" className="text-[#2AAFA0] text-sm font-extrabold shrink-0">
          Full dashboard →
        </Link>
      </div>

      <div className="grid lg:grid-cols-[65%_35%] gap-6">
        <div className="space-y-6">
          <Link
            to="/discoverer/dashboard"
            className="block bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4 mb-4">
              <UserAvatar name={childName} avatarId={avatarId} size={56} />
              <div>
                <h3 className="font-display text-2xl font-bold text-navy">{childName}</h3>
                <p className="text-sm text-teal font-bold">Discoverer {levelLabel}</p>
              </div>
            </div>
            <TealProgressBar value={xp} max={xp + starsToNext} showLabel />
            <p className="text-sm text-muted mt-3">You&apos;re on a great learning adventure!</p>
          </Link>

          <Link
            to="/discoverer/mission"
            className="block bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-navy text-lg">🎯 Daily Mission</h3>
              <span className="text-teal text-sm font-bold">Go →</span>
            </div>
            <ul className="space-y-2 text-sm text-navy mb-4">
              <li>{missionDone.read ? '✅' : '⭕'} Read 1 story</li>
              <li>{missionDone.quiz ? '✅' : '⭕'} Pass 1 quiz</li>
              <li>{missionDone.reflection ? '✅' : '⭕'} Answer 1 reflection</li>
            </ul>
            <p className="text-xs font-bold text-teal">+10 ⭐ bonus when complete</p>
          </Link>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-navy">My Badges</h3>
              <Link to="/discoverer/badges" className="text-teal text-sm font-bold">
                View all →
              </Link>
            </div>
            {earnedBadgeSlugs.size === 0 ? (
              <p className="text-sm text-muted mb-4">Earn your first badge by reading and completing quizzes!</p>
            ) : null}
            <div className="flex gap-4 overflow-x-auto pb-1">
              {DISCOVERER_BADGE_DISPLAY.slice(0, 6).map((b) => (
                <Link key={b.slug} to="/discoverer/badges" className="shrink-0">
                  <BadgeHexagon
                    icon={b.icon}
                    name={b.name}
                    color={b.color}
                    earned={earnedBadgeSlugs.has(b.slug)}
                    size="sm"
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-navy">My Learning Paths</h3>
              <Link to="/adventures" className="text-teal text-sm font-bold">
                View all →
              </Link>
            </div>
            {!hasPaths ? (
              <p className="text-muted text-sm">Begin your first path to track progress here.</p>
            ) : (
              <div className="space-y-4">
                {paths.slice(0, 4).map((p) => (
                  <Link key={p.id} to={learningPathDetailUrl(p.slug)} className="block group">
                    <p className="text-sm font-bold text-navy mb-1 group-hover:text-teal transition-colors">
                      {p.title}
                    </p>
                    <TealProgressBar value={p.path_progress?.completion_percentage ?? 0} showLabel />
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link
            to="/discoverer/streaks"
            className="block bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center hover:shadow-md transition-shadow"
          >
            <p className="text-4xl mb-2">🔥</p>
            {hasStreak ? (
              <>
                <p className="text-4xl font-extrabold text-[#F5A623]">{streak}</p>
                <p className="text-sm text-muted mb-4">day streak</p>
                <div className="flex justify-center gap-2">
                  {weekDots.map((on, i) => (
                    <span
                      key={i}
                      className={`w-3 h-3 rounded-full ${on ? 'bg-[#F5A623]' : 'bg-gray-200'}`}
                    />
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted">Start your first mission to begin a streak!</p>
            )}
          </Link>

          <Link
            to="/discoverer/certificates"
            className="block bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
          >
            <p className="text-3xl mb-2">📜</p>
            <h3 className="font-bold text-navy mb-1">Certificates</h3>
            {hasCertificates ? (
              <>
                <p className="text-2xl font-extrabold text-teal mb-3">{certificateCount}</p>
                <span className="text-teal font-extrabold text-sm">View →</span>
              </>
            ) : (
              <p className="text-sm text-muted">Complete a learning path to earn your first certificate.</p>
            )}
          </Link>
        </div>
      </div>
    </section>
  )
}
