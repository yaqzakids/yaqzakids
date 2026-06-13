import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '@/components/ProtectedRoute'
import { useSelectedChild } from '@/context/SelectedChildContext'
import ChildProfileSwitcher from '@/components/adventure/ChildProfileSwitcher'
import StarsDisplay from '@/components/adventure/StarsDisplay'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorMessage from '@/components/ErrorMessage'
import Breadcrumbs from '@/components/navigation/Breadcrumbs'
import PageBackNav from '@/components/navigation/PageBackNav'
import { fetchPathDetail } from '@/lib/adventure/service'
import type { AdventurePath, PathArticleWithProgress, PathProgress } from '@/lib/adventure/types'

export default function AdventurePathDetailPage() {
  const { pathSlug } = useParams<{ pathSlug: string }>()
  const { user } = useAuth()
  const { selectedChild } = useSelectedChild()
  const [path, setPath] = useState<AdventurePath | null>(null)
  const [articles, setArticles] = useState<PathArticleWithProgress[]>([])
  const [pathProgress, setPathProgress] = useState<PathProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    if (!pathSlug || !selectedChild) return
    setLoading(true)
    try {
      const data = await fetchPathDetail(pathSlug, selectedChild.id, user?.id ?? null)
      if (!data) {
        setError('Path not found.')
        return
      }
      setPath(data.path)
      setArticles(data.articles)
      setPathProgress(data.pathProgress)
    } catch {
      setError('Could not load path.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [pathSlug, selectedChild?.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !path) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <ErrorMessage message={error ?? 'Not found'} />
      </div>
    )
  }

  const pct = pathProgress?.completion_percentage ?? 0

  return (
    <div className="min-h-screen bg-bg page-transition">
      <div className="bg-white border-b border-gray-200 px-6 md:px-10 py-3">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <Link to="/" className="font-display font-bold text-navy no-underline">YAQZA KIDS</Link>
          <PageBackNav fallbackTo="/adventures" homeTo="/" />
        </div>
      </div>
      {path.cover_image_url && (
        <div className="relative h-56 md:h-72 overflow-hidden">
          <img src={path.cover_image_url} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/80 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 max-w-4xl">
            <Link to="/adventures" className="text-white/70 text-sm font-bold hover:text-white">← All Paths</Link>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-white mt-2">{path.title}</h1>
            <p className="text-white/80 mt-2">{path.description}</p>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-6 py-8">
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/' },
            { label: 'Learning Paths', to: '/adventures' },
            { label: path.title },
          ]}
          className="mb-6"
        />
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <ChildProfileSwitcher />
          <StarsDisplay childId={selectedChild?.id ?? null} />
        </div>

        {pathProgress && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-8 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-navy">
                {pathProgress.completed ? '🏆 Path Complete!' : 'Your Progress'}
              </span>
              <span className="text-teal font-bold">{Math.round(pct)}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-gold to-teal rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs text-muted mt-2">
              {pathProgress.completed_articles} of {pathProgress.total_articles} articles complete
            </p>
          </div>
        )}

        <h2 className="font-display text-xl font-bold text-navy mb-4">Adventure Steps</h2>
        <div className="space-y-3">
          {articles.map((pa, i) => (
            <div
              key={pa.id}
              className={`flex items-center gap-4 bg-white rounded-2xl border p-4 shadow-sm ${
                pa.complete ? 'border-teal' : pa.locked ? 'border-gray-200 opacity-75' : 'border-gray-200'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm shrink-0 ${
                pa.complete ? 'bg-teal text-white' : 'bg-[#FEF3C7] text-[#D4820A]'
              }`}>
                {pa.complete ? '✓' : i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-navy truncate">{pa.article?.title}</p>
                <p className="text-xs text-muted">
                  ⏱ {pa.article?.reading_time_minutes} min
                  {pa.progress?.read_completed && ' · 📖 Read'}
                  {pa.progress?.quiz_passed && ' · ✅ Quiz passed'}
                </p>
              </div>
              {pa.locked ? (
                <span className="text-xs font-bold text-muted">🔒 Locked</span>
              ) : (
                <Link
                  to={`/adventures/${path.slug}/${pa.article?.slug}`}
                  className="shrink-0 px-4 py-2 bg-gold text-white rounded-full text-xs font-extrabold hover:opacity-90"
                >
                  {pa.complete ? 'Review' : 'Start →'}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
