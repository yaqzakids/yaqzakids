import { Link } from 'react-router-dom'
import { SEQUENTIAL_LOCK_MESSAGE } from '@/lib/adventure/articleProgression'

interface LockedSequentialCardProps {
  articleTitle: string
  pathTitle?: string
  pathSlug?: string
  previousArticle?: { title: string; slug: string }
}

export default function LockedSequentialCard({
  articleTitle,
  pathTitle,
  pathSlug,
  previousArticle,
}: LockedSequentialCardProps) {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6 page-transition">
      <div className="bg-white rounded-2xl p-8 md:p-10 text-center max-w-md w-full shadow-lg border border-gray-200">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#FEF3C7] flex items-center justify-center text-2xl">
          🔒
        </div>
        <h1 className="font-display text-2xl font-bold text-navy mb-2">{articleTitle}</h1>
        {pathTitle && <p className="text-sm text-muted mb-4">{pathTitle}</p>}
        <p className="text-muted text-sm mb-2">{SEQUENTIAL_LOCK_MESSAGE}</p>
        {previousArticle && (
          <p className="text-navy text-sm font-semibold mb-6">
            Complete: {previousArticle.title}
          </p>
        )}
        {pathSlug && previousArticle ? (
          <Link
            to={`/adventures/${pathSlug}/${previousArticle.slug}`}
            className="inline-block bg-gold text-white px-8 py-3 rounded-full font-extrabold hover:opacity-90 transition-opacity"
          >
            Go to previous lesson
          </Link>
        ) : pathSlug ? (
          <Link
            to={`/adventures/${pathSlug}`}
            className="inline-block bg-gold text-white px-8 py-3 rounded-full font-extrabold hover:opacity-90 transition-opacity"
          >
            Back to path
          </Link>
        ) : null}
      </div>
    </div>
  )
}
