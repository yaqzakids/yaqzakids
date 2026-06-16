import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useAuth } from '@/components/ProtectedRoute'
import { useSelectedChild } from '@/context/SelectedChildContext'
import ChildProfileSwitcher from '@/components/adventure/ChildProfileSwitcher'
import StarsDisplay from '@/components/adventure/StarsDisplay'
import LockedArticleModal from '@/components/adventure/LockedArticleModal'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorMessage from '@/components/ErrorMessage'
import Breadcrumbs from '@/components/navigation/Breadcrumbs'
import PageBackNav from '@/components/navigation/PageBackNav'
import DiscovererPageShell from '@/components/discoverer/DiscovererPageShell'
import {
  articleStatusLabel,
  SEQUENTIAL_LOCK_MESSAGE,
} from '@/lib/adventure/articleProgression'
import type { PathArticleWithProgress } from '@/lib/adventure/types'
import {
  fetchLearningPathPageData,
  mergeMarketingWithPath,
} from '@/lib/paths/pathDetail'
import { isLearningPathSlug } from '@/lib/learningPaths'

export default function PathDetailPage() {
  const { pathSlug = '' } = useParams<{ pathSlug: string }>()
  const { user, loading: authLoading } = useAuth()
  const { selectedChild, loading: childLoading } = useSelectedChild()
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchLearningPathPageData>>>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lockedArticle, setLockedArticle] = useState<PathArticleWithProgress | null>(null)

  const isSignedInChildView = Boolean(user && selectedChild)

  useEffect(() => {
    if (!isLearningPathSlug(pathSlug)) {
      setLoading(false)
      setError('Path not found.')
      return
    }

    setLoading(true)
    setError(null)
    void fetchLearningPathPageData(
      pathSlug,
      selectedChild?.id ?? null,
      user?.id ?? null,
    )
      .then((result) => {
        if (!result) {
          setError('Path not found.')
          return
        }
        setData(result)
      })
      .catch(() => setError('Could not load this learning path.'))
      .finally(() => setLoading(false))
  }, [pathSlug, selectedChild?.id, user?.id])

  const display = useMemo(() => {
    if (!data) return null
    return mergeMarketingWithPath(data.marketing, data.adventurePath)
  }, [data])

  if (!isLearningPathSlug(pathSlug)) {
    return (
      <DiscovererPageShell navMode="public">
        <div className="min-h-[50vh] flex items-center justify-center px-6">
          <ErrorMessage message="Learning path not found." />
        </div>
      </DiscovererPageShell>
    )
  }

  if (authLoading || childLoading || loading) {
    return (
      <DiscovererPageShell navMode="public">
        <div className="min-h-[50vh] flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </DiscovererPageShell>
    )
  }

  if (user && !selectedChild) {
    return <Navigate to="/children" replace state={{ from: `/paths/${pathSlug}` }} />
  }

  if (error || !data || !display) {
    return (
      <DiscovererPageShell navMode="public">
        <div className="min-h-[50vh] flex items-center justify-center px-6">
          <ErrorMessage message={error ?? 'Path not found.'} />
        </div>
      </DiscovererPageShell>
    )
  }

  const { marketing, articles, pathProgress, adventureSlug, accessible } = data
  const completedCount =
    pathProgress?.completed_articles ?? articles.filter((item) => item.complete).length
  const totalCount = pathProgress?.total_articles ?? articles.length
  const pct =
    pathProgress?.completion_percentage ?? (totalCount ? (completedCount / totalCount) * 100 : 0)
  const nextLesson = articles.find((a) => !a.complete && !a.locked) ?? articles.find((a) => !a.complete)

  const lessonPreview =
    articles.length > 0
      ? articles.slice(0, 3).map((a) => a.article?.title).filter(Boolean)
      : marketing.sampleLessons

  return (
    <DiscovererPageShell navMode="public">
      <div className="min-h-screen bg-bg page-transition">
        {display.coverImageUrl && (
          <div className="relative h-56 md:h-72 overflow-hidden">
            <img src={display.coverImageUrl} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-navy/85 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:px-10 max-w-5xl mx-auto">
              <Link to="/paths" className="text-white/70 text-sm font-bold hover:text-white no-underline">
                ← All Learning Paths
              </Link>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-3xl">{display.icon}</span>
                <h1 className="font-display text-3xl md:text-4xl font-bold text-white m-0">{display.title}</h1>
              </div>
              <p className="text-white/85 mt-2 max-w-2xl">{display.mission}</p>
            </div>
          </div>
        )}

        <div className="max-w-5xl mx-auto px-6 md:px-10 py-8">
          <Breadcrumbs
            items={[
              { label: 'Home', to: '/welcome' },
              { label: 'Learning Paths', to: '/paths' },
              { label: display.title },
            ]}
            className="mb-6"
          />

          {isSignedInChildView && (
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <ChildProfileSwitcher />
              <StarsDisplay childId={selectedChild?.id ?? null} />
            </div>
          )}

          {isSignedInChildView && totalCount > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-8 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-navy">
                  {pathProgress?.completed ? '🏆 Path Complete!' : 'Your Progress'}
                </span>
                <span className="text-teal font-bold">{Math.round(pct)}%</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-gold to-teal rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-muted mt-2">
                {completedCount} / {totalCount} lessons completed
              </p>
              {nextLesson?.article && adventureSlug && (
                <Link
                  to={`/adventures/${adventureSlug}/${nextLesson.article.slug}`}
                  className="inline-block mt-4 px-6 py-2.5 bg-gold text-white rounded-full text-sm font-extrabold no-underline hover:opacity-90"
                >
                  Continue → {nextLesson.article.title}
                </Link>
              )}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h2 className="font-display text-xl font-bold text-navy mb-3">What children will learn</h2>
              <ul className="space-y-2 text-sm text-muted leading-relaxed m-0 pl-5">
                {marketing.whatYouLearn.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
            <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h2 className="font-display text-xl font-bold text-navy mb-3">Sample lessons</h2>
              <ul className="space-y-2 text-sm text-muted leading-relaxed m-0 pl-5">
                {lessonPreview.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          </div>

          <section className="bg-white rounded-2xl border border-gray-200 p-6 mb-8 shadow-sm">
            <h2 className="font-display text-xl font-bold text-navy mb-3">Age versions available</h2>
            <div className="flex flex-wrap gap-3">
              {marketing.ageGroups.map((age) => (
                <span
                  key={age}
                  className="px-4 py-2 rounded-full text-sm font-bold bg-teal/10 text-teal"
                >
                  {age}
                </span>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-gray-200 p-6 mb-8 shadow-sm">
            <h2 className="font-display text-xl font-bold text-navy mb-3">Islamic worldview themes</h2>
            <div className="flex flex-wrap gap-2">
              {marketing.islamicThemes.map((theme) => (
                <span
                  key={theme}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#FEF3C7] text-[#92400E]"
                >
                  {theme}
                </span>
              ))}
            </div>
          </section>

          {isSignedInChildView && articles.length > 0 && (
            <section className="mb-8">
              <h2 className="font-display text-xl font-bold text-navy mb-4">Your lessons</h2>
              <div className="space-y-3">
                {articles.map((pathArticle, index) => {
                  const status =
                    pathArticle.unlockStatus ??
                    (pathArticle.complete ? 'completed' : pathArticle.locked ? 'locked' : 'available')
                  const isPremiumLocked = pathArticle.lockReason === 'premium'
                  const statusLabel = isPremiumLocked ? '🔒 Family Plan' : articleStatusLabel(status)

                  return (
                    <div
                      key={pathArticle.id}
                      className={`flex items-center gap-4 bg-white rounded-2xl border p-4 shadow-sm ${
                        pathArticle.complete ? 'border-teal' : 'border-gray-200'
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
                        </p>
                        {pathArticle.locked && pathArticle.lockReason === 'sequential' && (
                          <p className="text-xs text-coral mt-1">{SEQUENTIAL_LOCK_MESSAGE}</p>
                        )}
                      </div>
                      {pathArticle.locked ? (
                        <button
                          type="button"
                          onClick={() => setLockedArticle(pathArticle)}
                          className="shrink-0 px-4 py-2 border border-gray-200 rounded-full text-xs font-extrabold text-muted hover:bg-gray-50"
                        >
                          🔒 Locked
                        </button>
                      ) : adventureSlug && pathArticle.article ? (
                        <Link
                          to={`/adventures/${adventureSlug}/${pathArticle.article.slug}`}
                          className="shrink-0 px-4 py-2 bg-gold text-white rounded-full text-xs font-extrabold no-underline hover:opacity-90"
                        >
                          {pathArticle.complete ? 'Review' : 'Start →'}
                        </Link>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {!isSignedInChildView && (
            <section className="bg-gradient-to-br from-navy to-[#2AAFA0] rounded-2xl p-8 text-center text-white mb-8">
              <h2 className="font-display text-2xl font-bold mb-2">Ready to begin?</h2>
              <p className="text-white/85 mb-6 max-w-lg mx-auto">{display.description}</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  to="/signup"
                  className="px-6 py-3 bg-gold text-white rounded-full font-extrabold no-underline hover:opacity-90"
                >
                  Start Free
                </Link>
                <Link
                  to="/login"
                  className="px-6 py-3 bg-white/15 text-white border border-white/30 rounded-full font-extrabold no-underline hover:bg-white/25"
                >
                  Sign In
                </Link>
              </div>
              {!accessible && (
                <p className="text-xs text-white/70 mt-4">Some lessons require a Family plan.</p>
              )}
            </section>
          )}

          <PageBackNav fallbackTo="/paths" homeTo="/welcome" />
        </div>
      </div>

      <LockedArticleModal
        open={Boolean(lockedArticle)}
        onClose={() => setLockedArticle(null)}
        articleTitle={lockedArticle?.article?.title}
        pathSlug={adventureSlug ?? pathSlug}
        previousArticle={
          lockedArticle?.previousArticle?.article
            ? {
                title: lockedArticle.previousArticle.article.title,
                slug: lockedArticle.previousArticle.article.slug,
              }
            : undefined
        }
      />
    </DiscovererPageShell>
  )
}
