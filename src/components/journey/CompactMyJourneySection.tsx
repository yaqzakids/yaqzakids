import { Link } from 'react-router-dom'
import { learningPathDetailUrl } from '@/lib/learningPaths'
import TealProgressBar from '@/components/discoverer/TealProgressBar'
import type { AgeGroup } from '@/lib/types'
import { profileDashboardPathForAgeGroup } from '@/lib/childProfiles'
import {
  JOURNEY_SECTION_TITLES,
  type CertificateProgress,
  type PillarCategoryProgress,
  type RecentAchievement,
} from '@/lib/journey/types'

export interface CompactMyJourneySectionProps {
  ageGroup: AgeGroup
  categoryProgress: PillarCategoryProgress[]
  recentAchievements: RecentAchievement[]
  certificateProgress: CertificateProgress
}

export default function CompactMyJourneySection({
  ageGroup,
  categoryProgress,
  recentAchievements,
  certificateProgress,
}: CompactMyJourneySectionProps) {
  const title = JOURNEY_SECTION_TITLES[ageGroup]
  const dashboardPath = profileDashboardPathForAgeGroup(ageGroup)
  const activeCategories = categoryProgress.filter((c) => c.hasProgress || c.totalLessons > 0)
  const previewCategories = (activeCategories.length > 0 ? activeCategories : categoryProgress).slice(0, 3)

  return (
    <section className="mb-10" aria-labelledby="compact-journey-heading">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 id="compact-journey-heading" className="font-display text-xl md:text-2xl font-bold text-[#1B2F5E]">
          {title}
        </h2>
        <Link to={dashboardPath} className="text-[#2AAFA0] text-sm font-extrabold shrink-0">
          View full journey →
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E2EBF8] p-4 md:p-5 shadow-sm">
          <p className="text-xs font-extrabold text-[#6B7280] uppercase tracking-wide mb-3">Category progress</p>
          {previewCategories.length === 0 ? (
            <p className="text-sm text-[#6B7280]">Start a learning path to see your progress here.</p>
          ) : (
            <ul className="space-y-3">
              {previewCategories.map((category) => (
                <li key={category.pillarId}>
                  <Link to={category.pathSlug ? learningPathDetailUrl(category.pathSlug) : '/paths'} className="block group">
                    <div className="flex items-center gap-2 mb-1">
                      <span aria-hidden>{category.icon ?? '📚'}</span>
                      <span className="text-sm font-bold text-[#1B2F5E] truncate group-hover:text-[#2AAFA0]">
                        {category.title}
                      </span>
                      <span className="ml-auto text-[10px] font-extrabold text-[#F5A623]">
                        {category.hasProgress ? `${category.progressPercent}%` : 'Start'}
                      </span>
                    </div>
                    {category.hasProgress && <TealProgressBar value={category.progressPercent} />}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#E2EBF8] p-4 shadow-sm">
            <p className="text-xs font-extrabold text-[#6B7280] uppercase tracking-wide mb-2">Recent achievements</p>
            {recentAchievements.length === 0 ? (
              <p className="text-sm text-[#6B7280]">Complete lessons to earn badges!</p>
            ) : (
              <ul className="space-y-2">
                {recentAchievements.slice(0, 2).map((item) => (
                  <li key={item.id} className="flex items-start gap-2">
                    <span aria-hidden>{item.icon}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#1B2F5E] truncate">{item.title}</p>
                      {item.starsEarned != null && (
                        <p className="text-xs font-extrabold text-[#F5A623]">+{item.starsEarned} Stars</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-[#E2EBF8] p-4 shadow-sm">
            <p className="text-xs font-extrabold text-[#6B7280] uppercase tracking-wide mb-2">Certificate</p>
            {certificateProgress.kind === 'empty' && (
              <p className="text-sm text-[#6B7280] leading-snug">
                Complete your first learning path to unlock a certificate.
              </p>
            )}
            {certificateProgress.kind === 'earned' && (
              <>
                <p className="font-bold text-[#1B2F5E] text-sm">{certificateProgress.pathName}</p>
                <p className="text-xs text-[#4AAE8A] font-semibold mt-1">Earned!</p>
              </>
            )}
            {certificateProgress.kind === 'in_progress' && (
              <>
                <p className="font-bold text-[#1B2F5E] text-sm">{certificateProgress.pathName}</p>
                <p className="text-xs font-extrabold text-[#F5A623] mt-1">
                  {certificateProgress.progressPercent}% complete
                </p>
                <TealProgressBar value={certificateProgress.progressPercent} className="mt-2" />
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
