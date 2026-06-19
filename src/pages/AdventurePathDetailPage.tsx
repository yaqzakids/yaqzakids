import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '@/components/ProtectedRoute'
import { useSelectedChild } from '@/context/SelectedChildContext'
import ChildProfileSwitcher from '@/components/adventure/ChildProfileSwitcher'
import StarsDisplay from '@/components/adventure/StarsDisplay'
import LockedArticleModal from '@/components/adventure/LockedArticleModal'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorMessage from '@/components/ErrorMessage'
import Breadcrumbs from '@/components/navigation/Breadcrumbs'
import PageBackNav from '@/components/navigation/PageBackNav'
import BrandLogo from '@/components/BrandLogo'
import {
  articleStatusLabel,
  SEQUENTIAL_LOCK_MESSAGE,
} from '@/lib/adventure/articleProgression'
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
  const [lockedArticle, setLockedArticle] = useState<PathArticleWithProgress | null>(null)

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
    void load()
  }, [pathSlug, selectedChild?.id, user?.id])

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

  const completedCount = pathProgress?.completed_articles ?? articles.filter((item) => item.complete).length
  const totalCount = pathProgress?.total_articles ?? articles.length
  const pct = pathProgress?.completion_percentage ?? (totalCount ? (completedCount / totalCount) * 100 : 0)

  const handleArticleClick = (pathArticle: PathArticleWithProgress) => {
    if (pathArticle.locked) {
      setLockedArticle(pathArticle)
    }
  }

  return (
    <div className="min-h-screen bg-bg page-transition">
      <div className="bg-white border-b border-gray-200 px-6 md:px-10 py-3">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <BrandLogo to="/home" height={40} />
          <PageBackNav fallbackTo="/adventures" homeTo="/home" />
        </div>
      </div>
      {path.cover_image_url && (
        <div className="relative h-56 md:h-72 overflow-hidden">
          <img src={path.cover_image_url} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/80 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 max-w-4xl">
            <Link to="/adventures" className="text-white/70 text-sm font-bold hover:text-white">
              ← All Paths
            </Link>
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

        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-8 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-navy">
              {pathProgress?.completed ? '🏆 Path Complete!' : 'Your Progress'}
            </span>
            <span className="text-teal font-bold">{Math.round(pct)}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-gold to-teal rounded-full"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-muted mt-2">
            {completedCount} / {totalCount} lessons completed
          </p>
        </div>

        <h2 className="font-display text-xl font-bold text-navy mb-4">Adventure Steps</h2>
        <div className="space-y-3">
          {articles.map((pathArticle, index) => {
            const status = pathArticle.unlockStatus ?? (pathArticle.complete ? 'completed' : pathArticle.locked ? 'locked' : 'available')
            const isPremiumLocked = pathArticle.lockReason === 'premium'
            const statusLabel = isPremiumLocked ? '🔒 Family Plan' : articleStatusLabel(status)

            return (
              <div
                key={pathArticle.id}
                className={`flex items-center gap-4 bg-white rounded-2xl border p-4 shadow-sm ${
                  pathArticle.complete
                    ? 'border-teal'
                    : pathArticle.locked
                      ? 'border-gray-200 opacity-80'
                      : 'border-gray-200'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm shrink-0 ${
                    pathArticle.complete
                      ? 'bg-teal text-white'
                      : pathArticle.locked
                        ? 'bg-gray-100 text-muted'
                        : 'bg-[#FEF3C7] text-[#D4820A]'
                  }`}
                >
                  {pathArticle.complete ? '✓' : index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-navy truncate">{pathArticle.article?.title}</p>
                  <p className="text-xs text-muted">
                    ⏱ {pathArticle.article?.reading_time_minutes} min · {statusLabel}
                    {pathArticle.progress?.read_completed && !pathArticle.complete && ' · 📖 Read'}
                  </p>
                  {pathArticle.locked && pathArticle.lockReason === 'sequential' && (
                    <p className="text-xs text-coral mt-1">{SEQUENTIAL_LOCK_MESSAGE}</p>
                  )}
                </div>
                {pathArticle.locked ? (
                  <button
                    type="button"
                    onClick={() => handleArticleClick(pathArticle)}
                    className="shrink-0 px-4 py-2 border border-gray-200 rounded-full text-xs font-extrabold text-muted hover:bg-gray-50"
                  >
                    🔒 Locked
                  </button>
                ) : (
                  <Link
                    to={`/adventures/${path.slug}/${pathArticle.article?.slug}`}
                    className="shrink-0 px-4 py-2 bg-gold text-white rounded-full text-xs font-extrabold hover:opacity-90"
                  >
                    {pathArticle.complete ? 'Review' : 'Start →'}
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <LockedArticleModal
        open={Boolean(lockedArticle)}
        onClose={() => setLockedArticle(null)}
        articleTitle={lockedArticle?.article?.title}
        pathSlug={path.slug}
        previousArticle={
          lockedArticle?.previousArticle?.article
            ? {
                title: lockedArticle.previousArticle.article.title,
                slug: lockedArticle.previousArticle.article.slug,
              }
            : undefined
        }
      />
    </div>
  )
}
