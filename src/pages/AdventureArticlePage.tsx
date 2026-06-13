import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSelectedChild } from '@/context/SelectedChildContext'
import ArticleProgressButton from '@/components/adventure/ArticleProgressButton'
import QuizComponent from '@/components/adventure/QuizComponent'
import StarsDisplay from '@/components/adventure/StarsDisplay'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorMessage from '@/components/ErrorMessage'
import DiscovererArticleView from '@/components/discoverer/DiscovererArticleView'
import { SiteNav } from '@/components/SiteNav'
import {
  fetchAdventureArticle,
  fetchArticleProgress,
} from '@/lib/adventure/service'
import { getLocalizedArticleFields } from '@/lib/admin/articleI18n'
import { STORAGE_KEYS } from '@/lib/constants'
import type { AdventureArticle, AdventurePath, ArticleProgress } from '@/lib/adventure/types'
import ReadAloudPlayer from '@/components/voice/ReadAloudPlayer'
import { buildArticleReadAloudBody } from '@/lib/voice/readAloudText'
import { resolveReadAloudLanguage } from '@/lib/voice/language'
import type { AgeGroup } from '@/lib/types'

export default function AdventureArticlePage() {
  const { pathSlug, articleSlug } = useParams<{ pathSlug: string; articleSlug: string }>()
  const { selectedChild } = useSelectedChild()
  const [path, setPath] = useState<AdventurePath | null>(null)
  const [article, setArticle] = useState<AdventureArticle | null>(null)
  const [quizId, setQuizId] = useState<string | null>(null)
  const [progress, setProgress] = useState<ArticleProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quizKey, setQuizKey] = useState(0)

  const ageGroup = (localStorage.getItem(STORAGE_KEYS.ageGroup) as AgeGroup) ?? selectedChild?.age_group ?? 'explorer'
  const readAloudLanguage = resolveReadAloudLanguage({
    childLanguage: selectedChild?.language,
    storedLanguage: localStorage.getItem(STORAGE_KEYS.language),
  })

  const load = async () => {
    if (!pathSlug || !articleSlug || !selectedChild) return
    setLoading(true)
    try {
      const data = await fetchAdventureArticle(pathSlug, articleSlug)
      if (!data) {
        setError('Article not found.')
        return
      }
      setPath(data.path)
      setArticle(data.article)
      setQuizId(data.quiz?.id ?? null)

      const prog = await fetchArticleProgress(selectedChild.id, data.article.id)
      setProgress(prog)
    } catch {
      setError('Could not load article.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [pathSlug, articleSlug, selectedChild?.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !article || !path || !selectedChild) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <ErrorMessage message={error ?? 'Not found'} />
      </div>
    )
  }

  const localized = getLocalizedArticleFields(article, readAloudLanguage, ageGroup)
  const content = localized.content

  if (ageGroup === 'discoverer') {
    return (
      <>
        <SiteNav variant="discoverer" />
        <DiscovererArticleView
          path={path}
          article={article}
          quizId={quizId}
          progress={progress}
          childId={selectedChild.id}
          localized={localized}
          language={readAloudLanguage}
          ageGroup={ageGroup}
          onProgressUpdated={setProgress}
        />
      </>
    )
  }

  const readAloudContent = buildArticleReadAloudBody({
    content,
    islamic_teaching: localized.islamic_teaching,
    think_about_it: localized.think_about_it,
    activity: localized.activity,
  })

  return (
    <div className="min-h-screen bg-bg page-transition">
      {article.cover_image_url && (
        <img src={article.cover_image_url} alt="" className="w-full h-56 object-cover" />
      )}
      <div className="max-w-3xl mx-auto px-6 py-8">
        <Link to={`/adventures/${path.slug}`} className="text-teal text-sm font-bold hover:underline">
          ← Back to {path.title}
        </Link>
        <div className="flex justify-between items-start gap-4 mt-4 mb-2">
          <h1 className="font-display text-3xl font-bold text-navy">{localized.title}</h1>
          <StarsDisplay childId={selectedChild?.id ?? null} />
        </div>
        <ReadAloudPlayer
          label="Listen to this article"
            title={localized.title}
          content={readAloudContent}
          language={readAloudLanguage}
          articleId={article.id}
          ageGroup={ageGroup}
        />
        <p className="text-muted text-sm mb-6 mt-4">⏱ {article.reading_time_minutes} min read</p>

        <div
          className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm space-y-4"
          dir={readAloudLanguage === 'ar' ? 'rtl' : 'ltr'}
        >
          <p
            className="text-navy leading-relaxed"
            style={readAloudLanguage === 'ar' ? { fontFamily: "'Noto Naskh Arabic', 'Amiri', serif", lineHeight: 1.9 } : undefined}
          >
            {content}
          </p>
          {localized.islamic_teaching && (
            <div className="bg-[#F0FBF5] rounded-xl p-4 border-l-4 border-teal">
              <p className="text-xs font-extrabold text-teal uppercase mb-2">☪️ What Islam Teaches</p>
              <p className="text-sm text-navy">{localized.islamic_teaching}</p>
            </div>
          )}
          {localized.think_about_it && localized.think_about_it.length > 0 && (
            <div className="bg-[#FFFBF0] rounded-xl p-4 border-l-4 border-gold">
              <p className="text-xs font-extrabold text-gold uppercase mb-2">💡 Think About It</p>
              <ul className="space-y-1">
                {localized.think_about_it.map((q, i) => (
                  <li key={i} className="text-sm text-navy">• {q}</li>
                ))}
              </ul>
            </div>
          )}
          {localized.activity && (
            <div className="bg-[#F5F3FF] rounded-xl p-4 border-l-4 border-purple">
              <p className="text-xs font-extrabold text-purple uppercase mb-2">🎨 Activity</p>
              <p className="text-sm text-navy">{localized.activity}</p>
            </div>
          )}
        </div>

        <ArticleProgressButton
          childId={selectedChild!.id}
          articleId={article.id}
          initialProgress={progress}
          onUpdated={setProgress}
        />

        {quizId && (
          <div className="mt-10" key={quizKey}>
            <QuizComponent
              childId={selectedChild!.id}
              quizId={quizId}
              language={readAloudLanguage}
              onPassed={() => {
                setQuizKey((k) => k + 1)
                load()
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
