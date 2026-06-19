import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '@/components/ProtectedRoute'
import { useSelectedChild } from '@/context/SelectedChildContext'
import ChildProfileSwitcher from '@/components/adventure/ChildProfileSwitcher'
import LockedArticleModal from '@/components/adventure/LockedArticleModal'
import ErrorMessage from '@/components/ErrorMessage'
import DiscovererPageShell from '@/components/discoverer/DiscovererPageShell'
import { SEQUENTIAL_LOCK_MESSAGE } from '@/lib/adventure/articleProgression'
import type { PathArticleWithProgress } from '@/lib/adventure/types'
import {
  fetchLearningPathPageData,
  mergeMarketingWithPath,
} from '@/lib/paths/pathDetail'

function PathDetailSkeleton({ color }: { color: string }) {
  return (
    <div className="min-h-screen animate-pulse" style={{ background: `${color}08` }}>
      <div className="h-56 md:h-72 bg-gray-200" />
      <div className="max-w-5xl mx-auto px-6 md:px-10 py-8 space-y-6">
        <div className="h-6 bg-gray-200 rounded w-1/3" />
        <div className="grid md:grid-cols-2 gap-4">
          <div className="h-40 bg-gray-200 rounded-2xl" />
          <div className="h-40 bg-gray-200 rounded-2xl" />
        </div>
        <div className="h-32 bg-gray-200 rounded-2xl" />
      </div>
    </div>
  )
}

const AGE_GROUP_CARDS = [
  { key: 'Explorer', ages: '5–8', emoji: '🌟' },
  { key: 'Discoverer', ages: '9–12', emoji: '🔭' },
  { key: 'Thinker', ages: '13–16', emoji: '🧠' },
] as const

export default function PathDetailPage() {
  const { pathSlug = '' } = useParams<{ pathSlug: string }>()
  const { user, loading: authLoading } = useAuth()
  const { selectedChild, loading: childLoading } = useSelectedChild()
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchLearningPathPageData>>>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lockedArticle, setLockedArticle] = useState<PathArticleWithProgress | null>(null)

  const isChildView = Boolean(user && selectedChild)

  useEffect(() => {
    setLoading(true)
    setError(null)
    void fetchLearningPathPageData(pathSlug, selectedChild?.id ?? null, user?.id ?? null)
      .then((result) => {
        if (!result) {
          setError('not_found')
          return
        }
        setData(result)
      })
      .catch(() => setError('load_failed'))
      .finally(() => setLoading(false))
  }, [pathSlug, selectedChild?.id, user?.id])

  const display = useMemo(() => {
    if (!data) return null
    return mergeMarketingWithPath(data.marketing, data.adventurePath)
  }, [data])

  if (authLoading || childLoading || loading) {
    return (
      <DiscovererPageShell navMode="public">
        <PathDetailSkeleton color={display?.color ?? '#2AAFA0'} />
      </DiscovererPageShell>
    )
  }

  if (error === 'not_found' || !data || !display) {
    return (
      <DiscovererPageShell navMode="public">
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center gap-4">
          <h1 className="font-display text-2xl font-bold text-navy m-0">Path not found</h1>
          <p className="text-muted max-w-md">We couldn&apos;t find that learning path. Try another from the list.</p>
          <Link to="/paths" className="px-6 py-3 bg-teal text-white rounded-full font-extrabold no-underline">
            Back to Learning Paths
          </Link>
        </div>
      </DiscovererPageShell>
    )
  }

  if (error === 'load_failed') {
    return (
      <DiscovererPageShell navMode="public">
        <div className="min-h-[50vh] flex items-center justify-center px-6">
          <ErrorMessage message="Could not load this learning path." />
        </div>
      </DiscovererPageShell>
    )
  }

  const { marketing, articles, pathProgress, adventureSlug, quizScores, starsEarned } = data
  const completedCount =
    pathProgress?.completed_articles ?? articles.filter((item) => item.complete).length
  const totalCount = pathProgress?.total_articles ?? articles.length
  const pct = Math.round(
    pathProgress?.completion_percentage ?? (totalCount ? (completedCount / totalCount) * 100 : 0),
  )
  const nextLesson = articles.find((a) => !a.complete && !a.locked)

  const sampleTitles =
    articles.length > 0
      ? articles.slice(0, 3).map((a) => a.article?.title).filter(Boolean) as string[]
      : marketing.sampleLessons

  return (
    <DiscovererPageShell navMode="public">
      <div className="min-h-screen pb-24 md:pb-8" style={{ background: `${display.color}06` }}>
        <div
          className="relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${display.color}22, ${display.color}44)` }}
        >
          {display.coverImageUrl && (
            <img
              src={display.coverImageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-40"
            />
          )}
          <div className="relative max-w-5xl mx-auto px-6 md:px-10 py-10 md:py-14">
            <Link to="/paths" className="text-sm font-bold no-underline" style={{ color: display.color }}>
              ← All Learning Paths
            </Link>
            <div className="flex items-start gap-4 mt-4">
              <span className="text-4xl md:text-5xl">{display.icon}</span>
              <div>
                <h1 className="font-display text-3xl md:text-4xl font-bold text-navy m-0">{display.title}</h1>
                {isChildView && selectedChild && (
                  <p className="text-sm font-semibold mt-2" style={{ color: display.color }}>
                    {selectedChild.name} · {pct}% complete
                  </p>
                )}
                <p className="text-muted mt-2 max-w-2xl leading-relaxed">{display.mission}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 md:px-10 py-8 space-y-6">
          {isChildView && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <ChildProfileSwitcher />
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-navy">Your Progress</span>
                  <span className="font-bold" style={{ color: display.color }}>{pct}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: display.color }}
                  />
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-muted">
                  <span>{completedCount} lessons completed</span>
                  <span>⭐ {starsEarned} stars earned</span>
                  {display.certificateEnabled && (
                    <span>{pct}% to certificate</span>
                  )}
                </div>
                {nextLesson?.article && adventureSlug && (
                  <Link
                    to={`/adventures/${adventureSlug}/${nextLesson.article.slug}`}
                    className="inline-block mt-4 px-6 py-2.5 text-white rounded-full text-sm font-extrabold no-underline"
                    style={{ background: display.color }}
                  >
                    Continue → {nextLesson.article.title}
                  </Link>
                )}
              </div>
            </>
          )}

          <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="font-display text-xl font-bold text-navy mb-3">What You Will Learn</h2>
            <ul className="space-y-2 text-sm text-muted m-0 pl-5 leading-relaxed">
              {marketing.whatYouLearn.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="font-display text-xl font-bold text-navy mb-4">Age Groups Available</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {AGE_GROUP_CARDS.map((age) => (
                <div
                  key={age.key}
                  className="rounded-xl border border-gray-200 p-4 text-center"
                  style={{ background: `${display.color}08` }}
                >
                  <div className="text-3xl mb-2">{age.emoji}</div>
                  <div className="font-bold text-navy">{age.key}</div>
                  <div className="text-xs text-muted mt-1">Ages {age.ages}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="font-display text-xl font-bold text-navy mb-3">Islamic Worldview</h2>
            <p className="text-sm text-muted leading-relaxed mb-3">
              This path connects everyday learning to faith — helping children see knowledge as a trust from Allah
              and a way to serve others with wisdom and character.
            </p>
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

          {!isChildView && (
            <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h2 className="font-display text-xl font-bold text-navy mb-4">Sample Lessons</h2>
              <ul className="space-y-3 m-0 p-0 list-none">
                {sampleTitles.map((title) => (
                  <li
                    key={title}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200"
                  >
                    <span className="text-lg opacity-60">🔒</span>
                    <span className="text-sm font-semibold text-navy">{title}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {isChildView && articles.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-bold text-navy mb-4">Lessons</h2>
              <div className="space-y-3">
                {articles.map((pathArticle, index) => {
                  const title = pathArticle.article?.title ?? 'Lesson'
                  const minutes = pathArticle.article?.reading_time_minutes ?? 5
                  const xp = 15
                  const score = quizScores[pathArticle.article_id]
                  const isComplete = pathArticle.complete
                  const isLocked = pathArticle.locked

                  return (
                    <div
                      key={pathArticle.id}
                      className={`flex flex-wrap items-center gap-4 bg-white rounded-2xl border p-4 shadow-sm ${
                        isLocked ? 'opacity-70 border-gray-200' : 'border-gray-200'
                      }`}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm shrink-0 text-white"
                        style={{ background: isComplete ? '#2AAFA0' : isLocked ? '#D1D5DB' : display.color }}
                      >
                        {isComplete ? '✓' : index + 1}
                      </div>
                      <div className="flex-1 min-w-[180px]">
                        <p className="font-bold text-navy m-0">{title}</p>
                        <p className="text-xs text-muted mt-1">
                          ⏱ {minutes} min · +{xp} XP
                          {isComplete && score != null && ` · Quiz ${score}%`}
                          {isComplete && ` · ⭐ ${xp} stars`}
                        </p>
                        {isLocked && pathArticle.lockReason === 'sequential' && (
                          <p className="text-xs text-coral mt-1">{SEQUENTIAL_LOCK_MESSAGE}</p>
                        )}
                      </div>
                      {isComplete ? (
                        <span className="text-sm font-bold text-teal">Completed ✅</span>
                      ) : isLocked ? (
                        <button
                          type="button"
                          onClick={() => setLockedArticle(pathArticle)}
                          className="px-4 py-2 rounded-full text-xs font-extrabold border border-gray-200 text-muted bg-gray-50"
                        >
                          🔒 Locked
                        </button>
                      ) : adventureSlug && pathArticle.article ? (
                        <Link
                          to={`/adventures/${adventureSlug}/${pathArticle.article.slug}`}
                          className="px-4 py-2 text-white rounded-full text-xs font-extrabold no-underline"
                          style={{ background: display.color }}
                        >
                          Start Lesson
                        </Link>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {isChildView && display.certificateEnabled && (
            <section
              className="rounded-2xl border p-6 text-center"
              style={{ borderColor: display.color, background: `${display.color}10` }}
            >
              <h2 className="font-display text-lg font-bold text-navy m-0">{display.certificateTitle}</h2>
              <p className="text-sm text-muted mt-2">
                {pathProgress?.completed
                  ? '🏆 Certificate unlocked — great work!'
                  : `${pct}% complete · Finish all lessons to unlock your certificate`}
              </p>
            </section>
          )}
        </div>

        {!isChildView && (
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg px-4 py-3 md:hidden">
            <div className="flex gap-3 max-w-lg mx-auto">
              <Link
                to="/signup"
                className="flex-1 text-center py-3 bg-gold text-white rounded-full font-extrabold text-sm no-underline"
              >
                Start Free
              </Link>
              <Link
                to="/login"
                className="flex-1 text-center py-3 border-2 border-navy text-navy rounded-full font-extrabold text-sm no-underline"
              >
                Sign In
              </Link>
            </div>
          </div>
        )}

        {!isChildView && (
          <div className="hidden md:block max-w-5xl mx-auto px-6 md:px-10 pb-10">
            <div
              className="rounded-2xl p-8 text-center text-white"
              style={{ background: `linear-gradient(135deg, ${display.color}, #1B2F5E)` }}
            >
              <div className="flex flex-wrap justify-center gap-3">
                <Link to="/signup" className="px-6 py-3 bg-gold text-white rounded-full font-extrabold no-underline">
                  Start Free
                </Link>
                <Link
                  to="/login"
                  className="px-6 py-3 bg-white/15 border border-white/30 text-white rounded-full font-extrabold no-underline"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        )}
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
