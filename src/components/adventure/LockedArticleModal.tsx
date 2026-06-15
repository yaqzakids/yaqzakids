import { Link } from 'react-router-dom'
import { SEQUENTIAL_LOCK_TOAST } from '@/lib/adventure/articleProgression'

interface LockedArticleModalProps {
  open: boolean
  onClose: () => void
  articleTitle?: string
  pathSlug?: string
  previousArticle?: { title: string; slug: string }
}

export default function LockedArticleModal({
  open,
  onClose,
  articleTitle,
  pathSlug,
  previousArticle,
}: LockedArticleModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 px-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="locked-article-title"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-3xl mb-3" aria-hidden>
          🔒
        </p>
        <h2 id="locked-article-title" className="font-display text-xl font-bold text-navy mb-2">
          {articleTitle ?? 'Lesson locked'}
        </h2>
        <p className="text-muted text-sm mb-4">{SEQUENTIAL_LOCK_TOAST}</p>
        {previousArticle && (
          <p className="text-sm text-navy font-semibold mb-6">
            Previous lesson: {previousArticle.title}
          </p>
        )}
        <div className="flex flex-col gap-3">
          {pathSlug && previousArticle && (
            <Link
              to={`/adventures/${pathSlug}/${previousArticle.slug}`}
              className="w-full text-center py-3 bg-gold text-white rounded-full font-extrabold hover:opacity-90"
              onClick={onClose}
            >
              Go to previous lesson
            </Link>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 border border-gray-200 rounded-full font-bold text-navy hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
