import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPublishedArticles } from '../../lib/supabase'
import { CATEGORY_COLORS, XP_REWARDS } from '../../lib/constants'
import type { Article } from '../../lib/types'
import LoadingSpinner from '../LoadingSpinner'
import ErrorMessage from '../ErrorMessage'

type ArticleGridVariant = 'explorer' | 'discoverer' | 'thinker'

interface ArticleGridProps {
  variant?: ArticleGridVariant
  title?: string
  label?: string
}

export default function ArticleGrid({ variant = 'explorer', title = 'What shall we learn today?', label = "TODAY'S ADVENTURES" }: ArticleGridProps) {
  const navigate = useNavigate()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isDark = variant === 'thinker'
  const xpReward = XP_REWARDS[variant]

  const fetchArticles = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getPublishedArticles(6)
      setArticles(data)
    } catch {
      setError('Failed to load articles. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchArticles() }, [])

  return (
    <section className={`py-12 px-6 md:px-10 ${isDark ? 'bg-[#243B6E]' : variant === 'discoverer' ? 'bg-bg' : 'bg-white'}`}>
      <p className={`text-xs font-extrabold tracking-[2px] uppercase mb-2 ${isDark ? 'text-gold' : 'text-teal'}`}>{label}</p>
      <h2 className={`font-display text-2xl md:text-[32px] font-bold mb-8 ${isDark ? 'text-white' : 'text-navy'}`}>{title}</h2>

      {loading && <LoadingSpinner className="py-16" />}
      {error && <ErrorMessage message={error} onRetry={fetchArticles} />}

      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.length === 0 ? (
            <p className={`col-span-full text-center py-8 ${isDark ? 'text-white/60' : 'text-muted'}`}>
              No articles yet. Check back soon!
            </p>
          ) : (
            articles.map((article) => (
              <div
                key={article.id}
                onClick={() => navigate(`/article/${article.id}`)}
                className={`rounded-2xl overflow-hidden border cursor-pointer transition-transform hover:-translate-y-1 ${
                  isDark ? 'bg-navy border-white/10' : 'bg-white border-gray-200'
                }`}
              >
                {article.image_url && (
                  <img src={article.image_url} alt={article.title_en} className="w-full h-40 object-cover" />
                )}
                <div className="p-3.5">
                  <span
                    className="inline-block text-[9px] font-extrabold uppercase rounded-full px-2 py-0.5 mb-1.5"
                    style={{ background: CATEGORY_COLORS[article.category] ?? '#FEF3C7', color: '#1B2F5E' }}
                  >
                    {article.category}
                  </span>
                  <h3 className={`text-[13px] font-bold leading-snug mb-2 ${isDark ? 'text-white' : 'text-navy'}`}>
                    {article.title_en}
                  </h3>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-[#9CA3AF]">⏱ {article.reading_time_minutes} min read</span>
                    <span className="text-[11px] font-bold text-gold">+{xpReward} XP</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  )
}
