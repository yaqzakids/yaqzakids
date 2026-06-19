import { useRef } from 'react'
import { Link } from 'react-router-dom'
import type { PathWithProgress } from '@/lib/adventure/types'
import type { AgeGroup } from '@/lib/types'
import {
  LEARNING_PATHS_SECTION,
  learningPathsSubtitleForAge,
  matchSectionPathProgress,
  sectionPathCoverUrl,
  sectionPathHasProgress,
} from '@/lib/learningPathsSectionConfig'

export interface LearningPathsSectionProps {
  allPaths?: PathWithProgress[]
  isSignedIn?: boolean
  ageGroup?: AgeGroup
  subtitle?: string
  className?: string
}

function PathCard({
  slug,
  title,
  description,
  buttonColor,
  coverUrl,
  ctaLabel,
}: {
  slug: string
  title: string
  description: string
  buttonColor: string
  coverUrl: string
  ctaLabel: string
}) {
  return (
    <Link
      to={`/paths/${slug}`}
      className="group shrink-0 w-[220px] sm:w-[240px] md:w-[252px] bg-white rounded-2xl shadow-[0_4px_24px_rgba(27,47,94,0.08)] border border-[#E8EEF8] overflow-hidden flex flex-col hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(27,47,94,0.12)] transition-all snap-start"
    >
      <div className="h-[132px] sm:h-[148px] overflow-hidden bg-[#EEF4FF]">
        <img
          src={coverUrl}
          alt=""
          className="w-full h-full object-cover object-center group-hover:scale-[1.03] transition-transform duration-300"
          loading="lazy"
          draggable={false}
        />
      </div>
      <div className="p-4 flex flex-col flex-1 min-h-[168px]">
        <h3 className="font-display font-bold text-[#1B2F5E] text-[15px] leading-snug mb-2">
          {title}
        </h3>
        <p className="text-[13px] text-[#6B7280] leading-relaxed flex-1 mb-4 line-clamp-3">
          {description}
        </p>
        <span
          className="inline-flex justify-center items-center py-2.5 rounded-full text-sm font-extrabold text-white mt-auto"
          style={{ backgroundColor: buttonColor }}
        >
          {ctaLabel}
        </span>
      </div>
    </Link>
  )
}

export default function LearningPathsSection({
  allPaths = [],
  isSignedIn = false,
  ageGroup = 'discoverer',
  subtitle,
  className = '',
}: LearningPathsSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const resolvedSubtitle =
    subtitle ?? learningPathsSubtitleForAge(ageGroup, isSignedIn)

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 280, behavior: 'smooth' })
  }

  return (
    <section
      id="learning-paths"
      className={`mb-10 rounded-3xl bg-gradient-to-br from-white via-[#FCFDFF] to-[#EEF4FF]/80 shadow-[0_10px_40px_rgba(27,47,94,0.07)] border border-white/90 px-5 py-7 md:px-8 md:py-8 ${className}`}
      aria-labelledby="learning-paths-heading"
    >
      <div className="mb-6">
        <h2
          id="learning-paths-heading"
          className="font-display text-xl md:text-[1.65rem] font-bold text-[#1B2F5E] leading-tight"
        >
          Explore Learning Paths
        </h2>
        <p className="text-sm md:text-[15px] text-[#6B7280] mt-1.5">{resolvedSubtitle}</p>
      </div>

      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-1 scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pr-12 md:pr-14"
        >
          {LEARNING_PATHS_SECTION.map((item) => {
            const livePath = matchSectionPathProgress(item.slug, allPaths)
            const hasProgress = isSignedIn && sectionPathHasProgress(livePath)
            const ctaLabel = isSignedIn ? (hasProgress ? 'Continue' : 'Start') : 'Start'

            return (
              <PathCard
                key={item.slug}
                slug={item.slug}
                title={item.title}
                description={item.description}
                buttonColor={item.buttonColor}
                coverUrl={sectionPathCoverUrl(item, livePath)}
                ctaLabel={ctaLabel}
              />
            )
          })}
        </div>

        <button
          type="button"
          aria-label="Scroll learning paths right"
          onClick={scrollRight}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-11 md:h-11 rounded-full bg-white border border-[#E2EBF8] shadow-[0_4px_16px_rgba(27,47,94,0.12)] text-[#1B2F5E] text-xl font-bold flex items-center justify-center hover:bg-[#F8FAFF] transition-colors"
        >
          ›
        </button>
      </div>
    </section>
  )
}
