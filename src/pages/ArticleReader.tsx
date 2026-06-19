import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { getArticleById, getQuizzesByArticleId, getRelatedArticles, getXPReward } from '../lib/supabase'
import { CATEGORY_COLORS, STORAGE_KEYS } from '../lib/constants'
import type { Article, AgeGroup, Quiz } from '../lib/types'
import ArticleContent from '../components/article/ArticleContent'
import SourceLinks from '../components/article/SourceLinks'
import QuizSection from '../components/article/QuizSection'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import PageBackNav from '@/components/navigation/PageBackNav'
import Breadcrumbs from '@/components/navigation/Breadcrumbs'
import BrandLogo from '@/components/BrandLogo'

const ageTabs: { id: AgeGroup; label: string; emoji: string }[] = [
  { id: 'explorer', label: 'Explorer', emoji: '🌱' },
  { id: 'discoverer', label: 'Discoverer', emoji: '🔍' },
  { id: 'thinker', label: 'Thinker', emoji: '🌍' },
]

export default function ArticleReader() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [article, setArticle] = useState<Article | null>(null)
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [related, setRelated] = useState<Article[]>([])
  const [ageGroup, setAgeGroup] = useState<AgeGroup>(
    (localStorage.getItem(STORAGE_KEYS.ageGroup) as AgeGroup) ?? 'explorer'
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLocked] = useState(false)

  const fetchArticle = async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const [art, quizData] = await Promise.all([
        getArticleById(id),
        getQuizzesByArticleId(id),
      ])
      if (!art) throw new Error('Article not found')
      setArticle(art)
      setQuizzes(quizData)
      const rel = await getRelatedArticles(art.category, art.id)
      setRelated(rel)
    } catch {
      setError('Failed to load article.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchArticle() }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <ErrorMessage message={error ?? 'Article not found'} onRetry={fetchArticle} />
      </div>
    )
  }

  const xpReward = getXPReward(article, ageGroup)

  return (
    <div className="min-h-screen bg-bg page-transition">
      <nav className="bg-white border-b border-gray-200 px-6 md:px-10 py-3 sticky top-0 z-50">
        <div className="max-w-[800px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <BrandLogo to="/discoverer" height={40} />
          <PageBackNav fallbackTo="/discoverer" homeTo="/discoverer" />
        </div>
      </nav>

      {article.image_url && (
        <img src={article.image_url} alt={article.title_en} className="w-full h-[400px] object-cover" />
      )}

      <div className="max-w-[800px] mx-auto px-6 md:px-10 py-8">
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/' },
            { label: article.category, to: '/discoverer/explore' },
            { label: article.title_en },
          ]}
          className="mb-4"
        />
        <span
          className="inline-block text-[9px] font-extrabold uppercase rounded-full px-2.5 py-0.5 mb-3"
          style={{ background: CATEGORY_COLORS[article.category] ?? '#FEF3C7', color: '#1B2F5E' }}
        >
          {article.category}
        </span>
        <h1 className="font-display text-3xl md:text-4xl font-extrabold text-navy mb-4">{article.title_en}</h1>
        <div className="flex flex-wrap gap-4 text-sm text-muted mb-6">
          <span>⏱ {article.reading_time_minutes} min read</span>
          <span className="text-gold font-bold">+{xpReward} XP</span>
          {article.published_date && <span>{article.published_date}</span>}
        </div>

        <div className="flex gap-2 mb-8 border-b border-gray-200">
          {ageTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setAgeGroup(tab.id)}
              className={`px-4 py-2 text-sm font-bold transition-colors border-b-2 -mb-px ${
                ageGroup === tab.id
                  ? 'border-gold text-navy'
                  : 'border-transparent text-muted hover:text-navy'
              }`}
            >
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          {isLocked && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
              <div className="text-center">
                <p className="text-4xl mb-3">🔒</p>
                <p className="font-bold text-navy mb-4">This content requires a Family Plan</p>
                <Link to="/signup" className="bg-gold text-white px-6 py-3 rounded-full font-extrabold hover:opacity-90">
                  Unlock with Family Plan
                </Link>
              </div>
            </div>
          )}
          <ArticleContent article={article as unknown as Record<string, unknown>} ageGroup={ageGroup} />
        </div>

        <SourceLinks article={article} />
        <QuizSection quizzes={quizzes} />
      </div>

      {related.length > 0 && (
        <section className="max-w-[800px] mx-auto px-6 md:px-10 pb-12">
          <h2 className="font-display text-2xl font-bold text-navy mb-5">Related Articles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 overflow-x-auto">
            {related.map((rel) => (
              <div
                key={rel.id}
                onClick={() => navigate(`/article/${rel.id}`)}
                className="bg-white rounded-2xl overflow-hidden border border-gray-200 cursor-pointer hover:-translate-y-1 transition-transform min-w-[200px]"
              >
                {rel.image_url && <img src={rel.image_url} alt={rel.title_en} className="w-full h-32 object-cover" />}
                <div className="p-3">
                  <h3 className="text-sm font-bold text-navy leading-snug">{rel.title_en}</h3>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
