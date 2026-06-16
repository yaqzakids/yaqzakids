import { Link } from 'react-router-dom'
import UserAvatar from '@/components/UserAvatar'
import TealProgressBar from '@/components/discoverer/TealProgressBar'
import { AGE_GROUP_META } from '@/lib/childProfiles'
import { STAR_LEVELS } from '@/lib/adventure/levels'
import type { LastUnfinishedArticle } from '@/lib/discoverer'
import type { AgeGroup } from '@/lib/types'

export interface PersonalizedHeroProps {
  ageGroup: AgeGroup
  childName: string
  avatarId: string | null
  levelNumber: number
  levelName: string
  xp: number
  stars: number
  streak: number
  missionDone: { read: boolean; quiz: boolean; reflection: boolean }
  lastArticle: LastUnfinishedArticle | null
  continuePathLabel?: string | null
}

function xpBounds(totalStars: number) {
  let idx = 0
  for (let i = 0; i < STAR_LEVELS.length; i++) {
    if (totalStars >= STAR_LEVELS[i].min) idx = i
  }
  const currentMin = STAR_LEVELS[idx].min
  const nextMin = STAR_LEVELS[idx + 1]?.min ?? totalStars
  return { currentMin, nextMin }
}

export default function PersonalizedHero({
  ageGroup,
  childName,
  avatarId,
  levelNumber,
  levelName,
  xp,
  stars,
  streak,
  missionDone,
  lastArticle,
  continuePathLabel,
}: PersonalizedHeroProps) {
  const ageMeta = AGE_GROUP_META[ageGroup]
  const { currentMin, nextMin } = xpBounds(xp)
  const xpInLevel = xp - currentMin
  const xpNeeded = nextMin - currentMin

  const continueLabel = lastArticle
    ? `${continuePathLabel ? `${continuePathLabel} → ` : ''}${lastArticle.title}`
    : null

  return (
    <section className="pt-6 pb-2">
      <div className="bg-white rounded-2xl shadow-sm border border-[#E2EBF8] p-5 md:p-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <UserAvatar name={childName} avatarId={avatarId} size={64} />
            <div className="min-w-0 flex-1">
              <p className="text-[#2AAFA0] text-xs font-extrabold tracking-widest uppercase mb-1">
                {ageMeta.label}
              </p>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-[#1B2F5E] mb-1">
                Welcome Back {childName} 👋
              </h1>
              <p className="text-sm font-bold text-[#1B2F5E]/70 mb-3">
                {ageMeta.label} Level {levelNumber} · {levelName}
              </p>
              <div className="max-w-xs mb-2">
                <div className="flex justify-between text-xs font-bold text-[#6B7280] mb-1">
                  <span>{xpInLevel} / {xpNeeded} XP</span>
                  <span className="text-[#F5A623]">⭐ {stars.toLocaleString()}</span>
                </div>
                <TealProgressBar value={xpInLevel} max={xpNeeded} />
              </div>
              <div className="flex flex-wrap gap-3 mt-3 text-sm font-extrabold">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFF8ED] text-[#D4820A]">
                  🔥 {streak} Day Streak
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EEF4FF] text-[#2AAFA0]">
                  ⭐ {stars.toLocaleString()} Stars
                </span>
              </div>
            </div>
          </div>

          <div className="lg:w-[280px] shrink-0 space-y-4">
            <div className="bg-[#F7FAFF] rounded-xl p-4 border border-[#E2EBF8]">
              <p className="font-bold text-[#1B2F5E] text-sm mb-2">Today&apos;s Mission</p>
              <ul className="space-y-1.5 text-sm font-semibold text-[#1B2F5E]">
                <li>{missionDone.read ? '☑' : '☐'} Read 1 Story</li>
                <li>{missionDone.quiz ? '☑' : '☐'} Pass 1 Quiz</li>
                <li>{missionDone.reflection ? '☑' : '☐'} Answer Reflection</li>
              </ul>
              <Link
                to="/discoverer/mission"
                className="inline-block mt-3 text-[#2AAFA0] text-xs font-extrabold hover:underline"
              >
                Go to mission →
              </Link>
            </div>

            {continueLabel && lastArticle && (
              <div className="bg-[#FFF8ED] rounded-xl p-4 border border-[#F5A623]/30">
                <p className="text-[10px] font-extrabold text-[#D4820A] uppercase mb-1">Continue</p>
                <p className="font-bold text-[#1B2F5E] text-sm mb-3 line-clamp-2">{continueLabel}</p>
                <Link
                  to={lastArticle.url}
                  className="inline-flex px-4 py-2 bg-[#2AAFA0] text-white rounded-full text-xs font-extrabold hover:opacity-90"
                >
                  Continue →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
