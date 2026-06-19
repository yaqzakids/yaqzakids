import { Link } from 'react-router-dom'
import { learningPathDetailUrl } from '@/lib/learningPaths'
import TealProgressBar from '@/components/discoverer/TealProgressBar'
import type { AgeGroup } from '@/lib/types'
import {
  JOURNEY_SECTION_TITLES,
  type CertificateProgress,
  type JourneyStats,
  type PillarCategoryProgress,
  type RecentAchievement,
} from '@/lib/journey/types'

export interface MyJourneySectionProps {
  ageGroup: AgeGroup
  childProfileId: string
  journeyStats: JourneyStats
  categoryProgress: PillarCategoryProgress[]
  recentAchievements: RecentAchievement[]
  certificateProgress: CertificateProgress
  certificatesRoute?: string
  badgesRoute?: string
}

function SummaryCard({
  label,
  value,
  emptyHint,
  accent,
}: {
  label: string
  value: string | null
  emptyHint: string
  accent?: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#E2EBF8] p-4 md:p-5 text-center shadow-sm">
      {value != null ? (
        <p className={`text-2xl md:text-3xl font-extrabold mb-1 ${accent ?? 'text-[#1B2F5E]'}`}>{value}</p>
      ) : (
        <p className="text-sm font-semibold text-[#6B7280] mb-1 leading-snug">{emptyHint}</p>
      )}
      <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wide">{label}</p>
    </div>
  )
}

function JourneySummary({ stats }: { stats: JourneyStats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <SummaryCard
        label="Stars"
        value={stats.stars != null ? `⭐ ${stats.stars.toLocaleString()}` : null}
        emptyHint="Read your first story to earn stars!"
        accent="text-[#F5A623]"
      />
      <SummaryCard
        label="Streak"
        value={stats.streak != null ? `${stats.streak} 🔥` : null}
        emptyHint="Come back tomorrow to start a streak!"
        accent="text-[#D4820A]"
      />
      <SummaryCard
        label="Lessons Completed"
        value={stats.lessonsCompleted != null ? String(stats.lessonsCompleted) : null}
        emptyHint="Complete a lesson to see progress here."
      />
      <SummaryCard
        label="Badges Earned"
        value={stats.badgesEarned != null ? String(stats.badgesEarned) : null}
        emptyHint="Earn badges as you learn!"
        accent="text-[#8B6BB1]"
      />
    </div>
  )
}

function CategoryProgressRow({ category }: { category: PillarCategoryProgress }) {
  const statusLabel =
    category.status === 'complete' ? 'Complete' : category.status === 'continue' ? 'Continue' : 'Start'

  const linkTo = category.pathSlug ? learningPathDetailUrl(category.pathSlug) : '/paths'

  return (
    <Link
      to={linkTo}
      className="block bg-white rounded-2xl border border-[#E2EBF8] p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-3 mb-3">
        <span
          className="text-2xl shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${category.color}22` }}
          aria-hidden
        >
          {category.icon ?? '📚'}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="font-bold text-[#1B2F5E] text-sm md:text-base truncate">{category.title}</h3>
            <span
              className={`text-[10px] font-extrabold uppercase shrink-0 px-2 py-0.5 rounded-full ${
                category.status === 'complete'
                  ? 'bg-[#ECFDF5] text-[#4AAE8A]'
                  : category.status === 'continue'
                    ? 'bg-[#EEF4FF] text-[#2AAFA0]'
                    : 'bg-[#FFF8ED] text-[#D4820A]'
              }`}
            >
              {statusLabel}
            </span>
          </div>
          {category.totalLessons > 0 ? (
            <p className="text-xs font-semibold text-[#6B7280]">
              {category.hasProgress
                ? `${category.completedLessons} / ${category.totalLessons} lessons`
                : `${category.totalLessons} lessons available`}
            </p>
          ) : (
            <p className="text-xs font-semibold text-[#6B7280]">Paths coming soon</p>
          )}
        </div>
      </div>
      {category.hasProgress && <TealProgressBar value={category.progressPercent} showLabel />}
    </Link>
  )
}

function RecentAchievementsPanel({
  achievements,
  badgesRoute,
}: {
  achievements: RecentAchievement[]
  badgesRoute: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#E2EBF8] p-5 md:p-6 shadow-sm h-full">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="font-display font-bold text-lg text-[#1B2F5E]">Recent Achievements</h3>
        <Link to={badgesRoute} className="text-[#2AAFA0] text-xs font-extrabold shrink-0">
          View all →
        </Link>
      </div>
      {achievements.length === 0 ? (
        <p className="text-sm text-[#6B7280] leading-relaxed">
          Complete lessons and quizzes to earn your first badge!
        </p>
      ) : (
        <ul className="space-y-3">
          {achievements.map((item) => (
            <li
              key={item.id}
              className="flex items-start gap-3 rounded-xl bg-[#F7FAFF] border border-[#E2EBF8] px-3 py-3"
            >
              <span className="text-2xl shrink-0" aria-hidden>
                {item.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-[#1B2F5E] text-sm">{item.title}</p>
                <p className="text-xs text-[#6B7280] mt-0.5 line-clamp-2">{item.reason}</p>
                {item.starsEarned != null && (
                  <p className="text-xs font-extrabold text-[#F5A623] mt-1">+{item.starsEarned} Stars</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function MyCertificatePanel({
  certificateProgress,
  certificatesRoute,
}: {
  certificateProgress: CertificateProgress
  certificatesRoute: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#E2EBF8] p-5 md:p-6 shadow-sm h-full flex flex-col">
      <h3 className="font-display font-bold text-lg text-[#1B2F5E] mb-4">My Certificate</h3>

      {certificateProgress.kind === 'empty' && (
        <div className="flex-1 flex flex-col justify-center text-center py-4">
          <p className="text-4xl mb-3" aria-hidden>
            📜
          </p>
          <p className="text-sm text-[#6B7280] leading-relaxed">
            Complete your first learning path to unlock a certificate.
          </p>
        </div>
      )}

      {certificateProgress.kind === 'earned' && (
        <div className="flex-1 flex flex-col">
          <p className="text-3xl mb-2" aria-hidden>
            🏆
          </p>
          <p className="font-bold text-[#1B2F5E] text-lg mb-1">{certificateProgress.pathName}</p>
          <p className="text-sm text-[#4AAE8A] font-semibold mb-4">Certificate earned!</p>
          <Link
            to={certificatesRoute}
            className="mt-auto inline-flex justify-center px-5 py-2.5 bg-[#2AAFA0] text-white rounded-full text-sm font-extrabold hover:opacity-90"
          >
            View Certificate
          </Link>
        </div>
      )}

      {certificateProgress.kind === 'in_progress' && (
        <div className="flex-1 flex flex-col">
          <p className="text-3xl mb-2" aria-hidden>
            📜
          </p>
          <p className="font-bold text-[#1B2F5E] text-lg mb-1">{certificateProgress.pathName}</p>
          <p className="text-sm font-extrabold text-[#F5A623] mb-3">
            {certificateProgress.progressPercent}% Complete
          </p>
          <TealProgressBar value={certificateProgress.progressPercent} showLabel className="mb-3" />
          <p className="text-sm text-[#6B7280] mb-4 flex-1">
            {certificateProgress.progressPercent >= 75
              ? "Keep going! You're almost there."
              : 'Keep learning to earn your certificate.'}
          </p>
          <Link
            to={learningPathDetailUrl(certificateProgress.pathSlug)}
            className="inline-flex justify-center px-5 py-2.5 border-2 border-[#2AAFA0] text-[#2AAFA0] rounded-full text-sm font-extrabold hover:bg-[#2AAFA0]/5"
          >
            View Certificate
          </Link>
        </div>
      )}
    </div>
  )
}

export default function MyJourneySection({
  ageGroup,
  childProfileId,
  journeyStats,
  categoryProgress,
  recentAchievements,
  certificateProgress,
  certificatesRoute = '/discoverer/certificates',
  badgesRoute = '/discoverer/badges',
}: MyJourneySectionProps) {
  const title = JOURNEY_SECTION_TITLES[ageGroup]

  return (
    <section className="mb-10" aria-labelledby="my-journey-heading" data-child-id={childProfileId}>
      <h2 id="my-journey-heading" className="font-display text-2xl md:text-3xl font-bold text-[#1B2F5E] mb-6">
        {title}
      </h2>

      <div className="space-y-6">
        <JourneySummary stats={journeyStats} />

        <div>
          <h3 className="font-bold text-[#1B2F5E] mb-3">Category Progress</h3>
          {categoryProgress.length === 0 ? (
            <p className="text-sm text-[#6B7280] bg-white rounded-2xl border border-[#E2EBF8] p-6 shadow-sm">
              Learning categories will appear here once paths are available.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
              {categoryProgress.map((category) => (
                <CategoryProgressRow key={category.pillarId} category={category} />
              ))}
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          <RecentAchievementsPanel achievements={recentAchievements} badgesRoute={badgesRoute} />
          <MyCertificatePanel certificateProgress={certificateProgress} certificatesRoute={certificatesRoute} />
        </div>
      </div>
    </section>
  )
}
