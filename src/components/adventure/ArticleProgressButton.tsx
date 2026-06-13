import { useState } from 'react'
import { markArticleRead } from '@/lib/adventure/service'
import type { ArticleProgress } from '@/lib/adventure/types'

interface ArticleProgressButtonProps {
  childId: string
  articleId: string
  initialProgress?: ArticleProgress | null
  onUpdated?: (progress: ArticleProgress) => void
}

export default function ArticleProgressButton({
  childId,
  articleId,
  initialProgress,
  onUpdated,
}: ArticleProgressButtonProps) {
  const [readCompleted, setReadCompleted] = useState(initialProgress?.read_completed ?? false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleMarkRead = async () => {
    if (readCompleted) return
    setLoading(true)
    setMessage(null)
    try {
      const progress = await markArticleRead(childId, articleId)
      setReadCompleted(true)
      setMessage('⭐ +10 Stars! Article marked as read.')
      onUpdated?.(progress)
    } catch {
      setMessage('Could not save progress. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleMarkRead}
        disabled={readCompleted || loading}
        className={`px-6 py-3 rounded-full font-extrabold text-sm transition-all ${
          readCompleted
            ? 'bg-teal/20 text-teal cursor-default'
            : 'bg-teal text-white hover:opacity-90 shadow-md'
        }`}
      >
        {readCompleted ? '✓ Finished Reading' : loading ? 'Saving...' : '📖 I Finished Reading!'}
      </button>
      {message && <p className="text-sm text-gold font-bold mt-2">{message}</p>}
    </div>
  )
}
