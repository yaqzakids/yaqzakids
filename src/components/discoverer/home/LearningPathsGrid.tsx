import { Link } from 'react-router-dom'
import TealProgressBar from '@/components/discoverer/TealProgressBar'
import {
  LEARNING_PATHS_HOME,
  matchPathForCategory,
  type LearningPathHome,
} from '@/lib/discoverer'
import { learningPathDetailUrl } from '@/lib/learningPaths'
import type { PathWithProgress } from '@/lib/adventure/types'

function PathCategoryCard({
  category,
  livePath,
  isSignedIn,
  scenic = false,
}: {
  category: LearningPathHome
  livePath?: PathWithProgress
  isSignedIn: boolean
  scenic?: boolean
}) {
  const totalLessons = livePath?.lessonCount ?? livePath?.path_progress?.total_articles ?? category.articles
  const completedLessons = livePath?.path_progress?.completed_articles ?? 0
  const pct = livePath?.path_progress?.completion_percentage ?? 0
  const hasProgress = completedLessons > 0 || pct > 0
  const pathSlug = livePath?.slug ?? category.slug
  const ctaTo = learningPathDetailUrl(pathSlug)
  const ctaLabel = isSignedIn ? (hasProgress ? 'Continue →' : 'Start →') : 'Explore →'

  if (scenic) {
    return (
      <Link
        to={ctaTo}
        className="shrink-0 snap-center w-[120px] md:w-[132px] flex flex-col items-center group"
      >
        <div
          className={`w-full aspect-[4/5] rounded-t-[999px] rounded-b-2xl bg-gradient-to-b ${category.gradient} border-2 border-white shadow-lg flex flex-col items-center justify-end pb-3 pt-6 px-2 group-hover:-translate-y-1 transition-transform`}
        >
          <span className="text-3xl md:text-4xl mb-2" aria-hidden>
            {category.emoji}
          </span>
        </div>
        <p className="mt-2 text-[10px] md:text-[11px] font-extrabold text-[#1B2F5E] text-center leading-tight px-1">
          {category.name}
        </p>
        {isSignedIn && hasProgress && (
          <p className="text-[9px] font-bold text-[#F5A623] mt-0.5">{pct}%</p>
        )}
      </Link>
    )
  }

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border-t-4 ${category.border} overflow-hidden flex flex-col h-full`}
    >
      <div
        className={`h-28 bg-gradient-to-br ${category.gradient} flex items-center justify-center text-5xl`}
        aria-hidden
      >
        {category.emoji}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-display font-bold text-[#1B2F5E] text-lg mb-2">{category.name}</h3>
        <p className="text-sm text-[#6B7280] leading-relaxed mb-4 flex-1">{category.mission}</p>

        {isSignedIn && (
          <div className="mb-4">
            <p className="text-xs font-bold text-[#6B7280] mb-1">
              Progress: {completedLessons} / {totalLessons} lessons
            </p>
            <TealProgressBar value={pct} showLabel className="mb-2" />
            {hasProgress && (
              <p className="text-xs font-extrabold text-[#F5A623]">
                ⭐ ~{completedLessons * 15} Stars earned
              </p>
            )}
          </div>
        )}

        {!isSignedIn && (
          <p className="text-xs font-bold text-[#6B7280] mb-4">{totalLessons} guided lessons</p>
        )}

        <Link
          to={ctaTo}
          className="inline-flex justify-center px-5 py-2.5 bg-[#2AAFA0] text-white rounded-full text-sm font-extrabold hover:opacity-90 mt-auto"
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
  )
}

export default function LearningPathsGrid({
  isSignedIn,
  allPaths,
  variant = 'grid',
}: {
  isSignedIn: boolean
  allPaths: PathWithProgress[]
  variant?: 'grid' | 'scenic'
}) {
  const isScenic = variant === 'scenic'

  return (
    <section
      id="learning-paths"
      className={`mb-10 ${isScenic ? 'pt-2' : 'pt-2 md:-mt-4'}`}
      aria-labelledby="learning-paths-heading"
    >
      <div className="flex items-center justify-between gap-4 mb-2">
        <div>
          <h2 id="learning-paths-heading" className="font-display text-xl md:text-2xl font-bold text-[#1B2F5E]">
            {isScenic ? 'Explore Learning Paths' : '🗺️ Explore Learning Paths'}
          </h2>
          {isScenic && (
            <p className="text-sm text-[#6B7280] mt-1">Choose a path and start your adventure!</p>
          )}
        </div>
        <Link
          to={isSignedIn ? '/adventures' : '/paths'}
          className="text-[#2AAFA0] text-sm font-extrabold shrink-0"
        >
          View all →
        </Link>
      </div>

      {!isScenic && (
        <p className="text-sm text-[#6B7280] mb-6 max-w-2xl">
          {isSignedIn
            ? 'Your guided journey through faith, science, history, and the world — pick up where you left off.'
            : 'Seven guided journeys that structure everything your child will learn on YaqzaKids.'}
        </p>
      )}

      {isScenic ? (
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#87CEAB]/40 via-[#B8E6C8]/50 to-[#7CB87A]/60 px-4 py-8 md:py-10">
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(ellipse 80% 50% at 50% 100%, #4A9B5F 0%, transparent 70%)',
            }}
            aria-hidden
          />
          <div className="relative flex gap-3 md:gap-4 overflow-x-auto pb-2 snap-x snap-mandatory justify-start md:justify-center">
            {LEARNING_PATHS_HOME.map((category) => (
              <PathCategoryCard
                key={category.slug}
                category={category}
                livePath={matchPathForCategory(category, allPaths)}
                isSignedIn={isSignedIn}
                scenic
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {LEARNING_PATHS_HOME.map((category) => (
            <PathCategoryCard
              key={category.slug}
              category={category}
              livePath={matchPathForCategory(category, allPaths)}
              isSignedIn={isSignedIn}
            />
          ))}
        </div>
      )}
    </section>
  )
}
