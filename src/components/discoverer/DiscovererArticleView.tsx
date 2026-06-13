import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Breadcrumbs from '@/components/navigation/Breadcrumbs'
import ParentGateLink from '@/components/parent/ParentGateLink'
import QuizComponent from '@/components/adventure/QuizComponent'
import ArticleProgressButton from '@/components/adventure/ArticleProgressButton'
import ReadAloudPlayer from '@/components/voice/ReadAloudPlayer'
import LoadingSpinner from '@/components/LoadingSpinner'
import {
  fetchQuizQuestions,
  shuffleOptions,
} from '@/lib/adventure/service'
import {
  pickLocalizedField,
  pickLocalizedThinkAbout,
  usulThemeLabel,
  saveReflectionResponse,
  fetchRelatedDiscovererArticles,
  resolveArticleUrl,
} from '@/lib/discoverer'
import { buildArticleReadAloudBody } from '@/lib/voice/readAloudText'
import type { AdventureArticle, AdventurePath, ArticleProgress, QuizQuestion } from '@/lib/adventure/types'
import type { AgeGroup, Language } from '@/lib/types'

type TabId = 'read' | 'quiz' | 'faith' | 'action'

interface DiscovererArticleViewProps {
  path: AdventurePath
  article: AdventureArticle
  quizId: string | null
  progress: ArticleProgress | null
  childId: string
  localized: {
    title: string
    content: string
    islamic_teaching: string | null
    think_about_it: string[] | null
    activity: string | null
  }
  language: Language
  ageGroup: AgeGroup
  onProgressUpdated: (p: ArticleProgress | null) => void
}

const USUL_DESCRIPTIONS: Record<string, string> = {
  tawhid: 'Everything begins with knowing Allah is One.',
  revelation: 'The Quran guides how we understand the world.',
  purpose: 'Allah created us with a meaningful purpose.',
  akhlaq: 'Good character shows what we truly believe.',
  akhirah: 'Our choices today shape our forever.',
  stewardship: 'We care for what Allah entrusted to us.',
  justice: 'Fairness and mercy go together.',
  knowledge: 'Seeking knowledge is an act of worship.',
}

export default function DiscovererArticleView({
  path,
  article,
  quizId,
  progress,
  childId,
  localized,
  language,
  ageGroup,
  onProgressUpdated,
}: DiscovererArticleViewProps) {
  const [tab, setTab] = useState<TabId>('read')
  const [reflectionText, setReflectionText] = useState('')
  const [reflectionSaved, setReflectionSaved] = useState(false)
  const [miniQuestions, setMiniQuestions] = useState<QuizQuestion[]>([])
  const [miniSelected, setMiniSelected] = useState<number | null>(null)
  const [miniCorrect, setMiniCorrect] = useState<boolean | null>(null)
  const [relatedArticles, setRelatedArticles] = useState<AdventureArticle[]>([])
  const [relatedUrls, setRelatedUrls] = useState<Record<string, string>>({})

  const funFacts = article.fun_facts?.length
    ? article.fun_facts
    : [
        { emoji: '🐝', fact: 'A single bee visits up to 5,000 flowers in one day!' },
        { emoji: '🌍', fact: 'Bees pollinate about one-third of the food we eat.' },
        { emoji: '💃', fact: 'Bees communicate by dancing — called the waggle dance!' },
      ]

  const vocabulary = article.vocabulary?.length
    ? article.vocabulary
    : [
        { word: 'Pollination', definition: 'When pollen moves between flowers so plants can grow fruit and seeds.' },
        { word: 'Ecosystem', definition: 'All the living things in an area working together.' },
        { word: 'Biodiversity', definition: 'The variety of different plants and animals in nature.' },
      ]

  const quranText = pickLocalizedField(
    article.quran_connection,
    article.quran_connection_i18n,
    language
  )
  const islamicReflection = pickLocalizedField(
    article.islamic_reflection ?? localized.islamic_teaching,
    article.islamic_reflection_i18n,
    language
  )
  const thinkAbout = pickLocalizedThinkAbout(
    article.think_about_it ?? localized.think_about_it,
    article.think_about_it_i18n,
    language
  )
  const takeAction = pickLocalizedField(
    article.take_action ?? localized.activity,
    article.take_action_i18n,
    language
  )
  const reflectionQuestion =
    article.reflection_question?.trim() ??
    thinkAbout[0] ??
    'What did this story teach you about Allah\'s creation?'

  const topicTags = ['Pollination', 'Ecosystems', 'Biodiversity']
  const usulTheme = article.usul_theme

  useEffect(() => {
    if (!quizId) return
    fetchQuizQuestions(quizId).then((qs) => setMiniQuestions(qs.slice(0, 1)))
  }, [quizId])

  useEffect(() => {
    fetchRelatedDiscovererArticles(article.id, 4).then(async (articles) => {
      setRelatedArticles(articles)
      const urls: Record<string, string> = {}
      for (const a of articles) {
        const u = await resolveArticleUrl(a.id)
        if (u) urls[a.id] = u
      }
      setRelatedUrls(urls)
    })
  }, [article.id])

  const miniQ = miniQuestions[0]
  const miniOptions = useMemo(
    () => (miniQ ? shuffleOptions(miniQ.options) : []),
    [miniQ?.id]
  )

  const handleMiniAnswer = (idx: number) => {
    if (!miniQ || miniSelected !== null) return
    setMiniSelected(idx)
    setMiniCorrect(Boolean(miniOptions[idx]?.is_correct))
  }

  const handleSaveReflection = async () => {
    if (!reflectionText.trim()) return
    await saveReflectionResponse(childId, article.id, reflectionText)
    setReflectionSaved(true)
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: 'read', label: 'Read' },
    { id: 'quiz', label: 'Quiz' },
    { id: 'faith', label: 'Faith & Reflection' },
    { id: 'action', label: 'Take Action' },
  ]

  const readAloudContent = buildArticleReadAloudBody({
    content: localized.content,
    islamic_teaching: localized.islamic_teaching,
    think_about_it: localized.think_about_it,
    activity: localized.activity,
  })

  return (
    <div className="min-h-screen bg-[#EEF4FF] page-transition">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-8">
        <nav className="text-sm text-muted mb-4">
          <Breadcrumbs
            items={[
              { label: 'Home', to: '/discoverer' },
              { label: 'Explore', to: '/discoverer/explore' },
              { label: path.title, to: `/adventures/${path.slug}` },
              { label: localized.title },
            ]}
          />
        </nav>

        <div className="grid lg:grid-cols-[65%_35%] gap-8 items-start">
          <div>
            <h1 className="font-display text-4xl font-bold text-navy mb-3">{localized.title}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted mb-5">
              <span className="bg-teal/10 text-teal px-3 py-1 rounded-full font-bold text-xs">
                {path.title}
              </span>
              <span>•</span>
              <span>{article.reading_time_minutes} min read</span>
              <span>•</span>
              <span>Ages 9–12</span>
            </div>

            {article.cover_image_url && (
              <img
                src={article.cover_image_url}
                alt=""
                className="w-full max-h-[300px] object-cover rounded-2xl mb-5"
              />
            )}

            <div className="flex flex-wrap gap-2 mb-6">
              {topicTags.map((t) => (
                <span key={t} className="px-3 py-1 bg-white rounded-full text-xs font-bold text-navy border border-gray-200">
                  {t}
                </span>
              ))}
            </div>

            <div className="sticky top-[72px] z-10 bg-[#EEF4FF] py-3 mb-4 -mx-1 px-1">
              <div className="flex gap-2 overflow-x-auto">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={`shrink-0 px-4 py-2 rounded-full text-sm font-extrabold transition-colors ${
                      tab === t.id
                        ? 'bg-navy text-white'
                        : 'bg-white text-navy border border-gray-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {tab === 'read' && (
              <div>
                <ReadAloudPlayer
                  label="Listen to this article"
                  title={localized.title}
                  content={readAloudContent}
                  language={language}
                  articleId={article.id}
                  ageGroup={ageGroup}
                />
                <div
                  className="bg-white rounded-2xl p-6 shadow-sm mb-6 mt-4"
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                >
                  <p
                    className="text-navy leading-[1.8] text-base whitespace-pre-wrap"
                    style={language === 'ar' ? { fontFamily: "'Amiri', 'Traditional Arabic', serif" } : undefined}
                  >
                    {localized.content}
                  </p>
                </div>

                <section className="mb-8">
                  <h2 className="font-bold text-navy text-lg mb-4">Did You Know? 🤔</h2>
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {funFacts.map((f, i) => (
                      <div
                        key={i}
                        className="shrink-0 w-64 bg-teal text-white rounded-xl p-4"
                      >
                        <p className="text-2xl mb-2">{f.emoji}</p>
                        <p className="text-sm leading-relaxed">{f.fact}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="font-bold text-navy text-lg mb-4">Word Explorer 📚</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {vocabulary.map((v) => (
                      <div key={v.word} className="bg-[#EEF4FF] rounded-xl p-4">
                        <p className="font-extrabold text-navy">{v.word}</p>
                        <p className="text-sm text-muted mt-1">{v.definition}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <ArticleProgressButton
                  childId={childId}
                  articleId={article.id}
                  initialProgress={progress}
                  onUpdated={onProgressUpdated}
                />
              </div>
            )}

            {tab === 'quiz' && (
              <div>
                {quizId ? (
                  <QuizComponent
                    childId={childId}
                    quizId={quizId}
                    language={language}
                  />
                ) : (
                  <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                    <p className="text-muted">No quiz available for this story yet.</p>
                  </div>
                )}
              </div>
            )}

            {tab === 'faith' && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-[#F5A623]">
                    <p className="font-bold text-navy mb-3">🕌 Quran Connection</p>
                    {quranText ? (
                      <>
                        <p
                          dir="rtl"
                          className="text-xl leading-loose mb-3 pr-3 border-r-4 border-[#F5A623]"
                          style={{ fontFamily: "'Amiri', 'Traditional Arabic', serif", color: '#1B2F5E' }}
                        >
                          {quranText}
                        </p>
                        <p className="text-sm text-navy/70 italic">{quranText}</p>
                      </>
                    ) : (
                      <p className="text-sm text-muted italic">Quran connection coming soon.</p>
                    )}
                    {article.quran_reference && (
                      <p className="text-xs font-bold text-teal mt-3">{article.quran_reference}</p>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl p-5 shadow-sm">
                    <p className="font-bold text-navy mb-3">🌙 Islamic Reflection (Ages 9–12)</p>
                    <p className="text-sm text-navy leading-relaxed">
                      {islamicReflection || localized.islamic_teaching || 'Every story connects to what Muslims believe about Allah and His creation.'}
                    </p>
                    <p className="text-4xl text-center mt-4">🧒</p>
                  </div>

                  <div className="bg-[#1B2F5E] rounded-2xl p-5 text-white">
                    <p className="text-xs font-extrabold uppercase text-white/60 mb-1">Usul Theme</p>
                    <p className="font-display text-2xl font-bold text-[#F5A623] mb-2">
                      {usulThemeLabel(usulTheme)}
                    </p>
                    <p className="text-sm text-white/80">
                      {usulTheme ? USUL_DESCRIPTIONS[usulTheme] : 'Every story connects to Islamic foundations.'}
                    </p>
                    <p className="text-3xl mt-4">✨</p>
                  </div>
                </div>

                {article.hadith_connection && (
                  <div className="bg-white rounded-2xl p-5 shadow-sm">
                    <p className="font-bold text-navy mb-2">📜 Hadith Connection</p>
                    <p className="text-sm text-navy leading-relaxed">{article.hadith_connection}</p>
                    {article.hadith_reference && (
                      <p className="text-xs font-bold text-teal mt-2">{article.hadith_reference}</p>
                    )}
                  </div>
                )}

                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <p className="font-bold text-navy mb-3">💭 Think About It</p>
                  <ul className="space-y-2">
                    {(thinkAbout.length ? thinkAbout : [
                      'What signs of Allah do you notice in this topic?',
                      'How does this knowledge change how you act?',
                      'Who could you share this with?',
                    ]).map((q, i) => (
                      <li key={i} className="text-sm text-navy">• {q}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <p className="font-bold text-navy mb-2">🌱 Take Action</p>
                  <p className="text-sm text-navy mb-4">
                    {takeAction || 'Try one small action today based on what you learned.'}
                  </p>
                  <p className="text-sm font-bold text-navy mb-2">{reflectionQuestion}</p>
                  <textarea
                    value={reflectionText}
                    onChange={(e) => setReflectionText(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm mb-3 focus:border-teal focus:outline-none"
                    placeholder="Write your reflection…"
                  />
                  <button
                    type="button"
                    onClick={handleSaveReflection}
                    disabled={!reflectionText.trim() || reflectionSaved}
                    className="px-5 py-2 bg-teal text-white rounded-full text-sm font-extrabold disabled:opacity-50"
                  >
                    {reflectionSaved ? 'Saved ✓' : 'Save My Reflection'}
                  </button>
                </div>
              </div>
            )}

            {tab === 'action' && (
              <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="font-display text-xl font-bold text-navy mb-4">Your Activity</h2>
                <p className="text-navy leading-relaxed whitespace-pre-wrap mb-6">
                  {takeAction || localized.activity || 'Choose one way to put today\'s learning into action — help someone, notice nature, or share what you learned.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.share) {
                      void navigator.share({
                        title: localized.title,
                        text: `I learned about ${localized.title} on YaqzaKids!`,
                      })
                    }
                  }}
                  className="px-5 py-2 border-2 border-navy text-navy rounded-full text-sm font-extrabold"
                >
                  Share
                </button>
              </div>

              {relatedArticles.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="font-display text-xl font-bold text-navy mb-4">More To Explore</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {relatedArticles.map((a) => (
                      <Link
                        key={a.id}
                        to={relatedUrls[a.id] ?? '/discoverer/explore'}
                        className="flex gap-3 p-3 rounded-xl border border-gray-100 hover:border-teal/40 transition-colors"
                      >
                        {a.cover_image_url && (
                          <img src={a.cover_image_url} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                        )}
                        <div>
                          <p className="font-bold text-navy text-sm line-clamp-2">{a.title}</p>
                          <p className="text-xs text-muted mt-1">{a.reading_time_minutes} min read</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              </div>
            )}
          </div>

          {tab === 'read' && (
            <aside className="lg:sticky lg:top-24 space-y-5">
              <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
                <h3 className="font-bold text-navy mb-4">Quick Quiz</h3>
                {!miniQ ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <p className="text-xs text-muted mb-2">Question 1 of 5</p>
                    <p className="font-bold text-navy text-sm mb-4">{miniQ.question_text}</p>
                    <div className="space-y-2">
                      {miniOptions.map((opt, idx) => {
                        const letter = ['A', 'B', 'C', 'D'][idx]
                        let cls = 'border border-gray-200 bg-white text-navy'
                        if (miniSelected === idx) {
                          cls = miniCorrect
                            ? 'bg-teal text-white border-teal'
                            : 'bg-coral text-white border-coral'
                        }
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleMiniAnswer(idx)}
                            className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold ${cls}`}
                          >
                            {letter}. {opt.text}
                            {miniSelected === idx && (miniCorrect ? ' ✓' : ' ✗')}
                          </button>
                        )
                      })}
                    </div>
                    {miniCorrect === true && (
                      <div className="mt-4 bg-[#EEF4FF] rounded-xl p-3 text-sm">
                        <p className="font-bold text-teal">Correct! 🎉</p>
                        <p className="text-navy mt-1">{miniQ.explanation}</p>
                      </div>
                    )}
                    {quizId && (
                      <button
                        type="button"
                        onClick={() => setTab('quiz')}
                        className="mt-4 text-teal text-sm font-extrabold"
                      >
                        Full quiz →
                      </button>
                    )}
                  </>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
                <h3 className="font-bold text-navy mb-3">Parent Preview</h3>
                <p className="text-xs font-extrabold text-teal uppercase mb-2">This Week</p>
                <ul className="text-sm text-navy space-y-1 mb-4">
                  <li>📖 Articles read: 3</li>
                  <li>❓ Quizzes completed: 2</li>
                </ul>
                <p className="text-xs font-extrabold text-muted uppercase mb-2">Top Themes</p>
                <div className="flex gap-2 flex-wrap mb-4">
                  {['Stewardship', 'Knowledge', 'Tawhid'].map((t) => (
                    <span key={t} className="text-xs bg-[#EEF4FF] text-navy px-2 py-1 rounded-full font-bold">
                      {t}
                    </span>
                  ))}
                </div>
                <p className="text-xs font-extrabold text-muted uppercase mb-1">Family Discussion Idea</p>
                <p className="text-sm text-navy mb-3">
                  How can we show gratitude for the amazing things Allah created in nature?
                </p>
                <ParentGateLink to="/parent/dashboard" className="text-teal text-sm font-extrabold">
                  View full report →
                </ParentGateLink>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}
