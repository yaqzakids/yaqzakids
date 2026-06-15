import { Link } from 'react-router-dom'
import TealProgressBar from '@/components/discoverer/TealProgressBar'
import type { LastUnfinishedArticle } from '@/lib/discoverer'
import type { PathWithProgress } from '@/lib/adventure/types'

export default function ContinueLearningSection({
  lastArticle,
  activePath,
  pathLabel,
}: {
  lastArticle: LastUnfinishedArticle | null
  activePath: PathWithProgress | null
  pathLabel: string | null
}) {
  if (!lastArticle && !activePath) {
    return (
      <section className="mb-10">
        <h2 className="font-display text-xl font-bold text-[#1B2F5E] mb-4">Continue where you left off</h2>
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center border border-[#EEF4FF]">
          <p className="text-4xl mb-3" aria-hidden>
            🚀
          </p>
          <p className="font-bold text-[#1B2F5E] text-lg mb-2">Start your first learning path</p>
          <p className="text-sm text-[#6B7280] mb-5">
            Choose a path above and complete your first lesson to begin earning stars.
          </p>
          <Link
            to="/adventures"
            className="inline-flex px-6 py-2.5 bg-[#2AAFA0] text-white rounded-full font-extrabold text-sm shadow-sm hover:opacity-90"
          >
            Browse Paths →
          </Link>
        </div>
      </section>
    )
  }

  const title = lastArticle?.title ?? activePath?.nextArticleTitle ?? activePath?.title ?? 'Continue learning'
  const url = lastArticle?.url ?? (activePath ? `/adventures/${activePath.slug}` : '/adventures')
  const category = pathLabel ?? activePath?.title ?? 'Learning Path'
  const totalLessons = activePath?.lessonCount ?? activePath?.path_progress?.total_articles ?? 0
  const completedLessons = activePath?.path_progress?.completed_articles ?? 0
  const lessonNum = completedLessons > 0 ? completedLessons + 1 : 1

  return (
    <section className="mb-10">
      <h2 className="font-display text-xl font-bold text-[#1B2F5E] mb-4">Continue where you left off</h2>
      <Link
        to={url}
        className="block bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow border border-[#EEF4FF] md:flex"
      >
        <div className="md:w-52 h-40 md:h-auto bg-gradient-to-br from-[#1B2F5E] to-[#2AAFA0] flex items-center justify-center shrink-0">
          <span className="text-5xl" aria-hidden>
            📖
          </span>
        </div>
        <div className="p-6 flex-1">
          <p className="text-[10px] font-extrabold text-[#2AAFA0] uppercase mb-1">{category}</p>
          <p className="font-bold text-[#1B2F5E] text-xl mb-2">{title}</p>
          {totalLessons > 0 && (
            <p className="text-sm text-[#6B7280] mb-3">
              Lesson {Math.min(lessonNum, totalLessons)} of {totalLessons}
            </p>
          )}
          {activePath && (
            <TealProgressBar
              value={activePath.path_progress?.completion_percentage ?? 0}
              showLabel
              className="mb-3 max-w-xs"
            />
          )}
          <span className="text-[#2AAFA0] font-extrabold text-sm">Continue →</span>
        </div>
      </Link>
    </section>
  )
}
