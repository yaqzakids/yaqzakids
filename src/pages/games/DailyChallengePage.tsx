import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PublicLayout from '@/components/layout/PublicLayout'
import LoadingSpinner from '@/components/LoadingSpinner'
import PageSeo from '@/components/seo/PageSeo'
import { useSelectedChild } from '@/context/SelectedChildContext'
import { useAuth } from '@/components/ProtectedRoute'
import {
  correctAnswerText,
  fetchDailyChallengeQuestion,
  fetchDailyChallengeStreak,
  fetchTodayAttempt,
  formatCountdown,
  msUntilNextDailyChallenge,
  submitDailyChallenge,
  type DailyChallengeQuestion,
} from '@/lib/games/dailyChallenge'

export default function DailyChallengePage() {
  const { user } = useAuth()
  const { selectedChild } = useSelectedChild()
  const [question, setQuestion] = useState<DailyChallengeQuestion | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [attempted, setAttempted] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [streak, setStreak] = useState(0)
  const [countdown, setCountdown] = useState(formatCountdown(msUntilNextDailyChallenge()))
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const q = await fetchDailyChallengeQuestion()
      setQuestion(q)

      if (selectedChild) {
        const [todayAttempt, currentStreak] = await Promise.all([
          fetchTodayAttempt(selectedChild.id),
          fetchDailyChallengeStreak(selectedChild.id),
        ])
        setStreak(currentStreak)
        if (todayAttempt) {
          setAttempted(true)
          setIsCorrect(todayAttempt.is_correct)
          setSelectedAnswer(todayAttempt.selected_answer)
        }
      }
    } catch {
      setError('Could not load today\'s challenge. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [selectedChild])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const tick = () => setCountdown(formatCountdown(msUntilNextDailyChallenge()))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [])

  const handleSubmit = async () => {
    if (!selectedChild || !question || !selected || attempted) return
    setSubmitting(true)
    setError(null)
    try {
      const result = await submitDailyChallenge(selectedChild.id, question.id, selected)
      setAttempted(true)
      setIsCorrect(result.is_correct)
      setSelectedAnswer(result.selected_answer)
      const newStreak = await fetchDailyChallengeStreak(selectedChild.id)
      setStreak(newStreak)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit your answer.')
    } finally {
      setSubmitting(false)
    }
  }

  const correctText = question ? correctAnswerText(question) : ''

  return (
    <PublicLayout bg="bg-[#EEF4FF]">
      <PageSeo
        title="Daily Challenge"
        description="One question a day. Can you answer it?"
        path="/games/daily-challenge"
      />
      <div className="max-w-2xl mx-auto px-5 py-10 md:py-14">
        <Link to="/games" className="text-[#2AAFA0] text-sm font-extrabold hover:underline">
          ← Back to Games
        </Link>

        <header className="text-center mt-6 mb-8">
          <div className="text-6xl mb-3">⭐</div>
          <h1 className="font-display font-bold text-[#1B2F5E] mb-2" style={{ fontSize: '36px' }}>
            Daily Challenge
          </h1>
          <p className="text-[#6B7280] font-semibold">One question a day. Can you answer it?</p>
        </header>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 text-center">
            <p className="text-xs font-extrabold text-[#9CA3AF] uppercase tracking-wide mb-1">Streak</p>
            <p className="font-display text-3xl font-bold text-[#F5A623]">{streak} 🔥</p>
            <p className="text-xs text-[#6B7280] mt-1">days in a row</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 text-center">
            <p className="text-xs font-extrabold text-[#9CA3AF] uppercase tracking-wide mb-1">Next Challenge</p>
            <p className="font-display text-2xl font-bold text-[#1B2F5E]">{countdown}</p>
            <p className="text-xs text-[#6B7280] mt-1">until tomorrow</p>
          </div>
        </div>

        {!user || !selectedChild ? (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 text-center">
            <p className="text-[#1B2F5E] font-bold mb-2">Sign in and select a child to play</p>
            <p className="text-sm text-[#6B7280] mb-6">
              Daily Challenge tracks one attempt per day and awards ⭐ 50 stars for a correct answer.
            </p>
            <Link
              to="/login"
              className="inline-flex px-8 py-3 bg-[#F5A623] text-white rounded-full text-sm font-extrabold hover:opacity-90"
            >
              Sign In →
            </Link>
          </div>
        ) : loading ? (
          <div className="py-16 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : !question ? (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 text-center text-[#6B7280]">
            No quiz questions available yet. Check back soon!
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 md:p-8 shadow-sm">
            <p className="text-xs font-extrabold text-[#2AAFA0] uppercase tracking-wide mb-3">
              Today&apos;s Question
            </p>
            <h2 className="font-display text-xl font-bold text-[#1B2F5E] mb-6">{question.question_text}</h2>

            <div className="space-y-3 mb-6">
              {question.labeledOptions.map((opt) => {
                const isChosen = attempted
                  ? selectedAnswer === opt.text
                  : selected === opt.text
                const showCorrect = attempted && opt.is_correct
                const showWrong = attempted && isChosen && !opt.is_correct

                return (
                  <button
                    key={opt.letter}
                    type="button"
                    disabled={attempted || submitting}
                    onClick={() => setSelected(opt.text)}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-colors ${
                      showCorrect
                        ? 'border-[#16a34a] bg-green-50 text-[#16a34a]'
                        : showWrong
                          ? 'border-[#E85D4A] bg-red-50 text-[#E85D4A]'
                          : isChosen
                            ? 'border-[#F5A623] bg-[#FFF8ED] text-[#1B2F5E]'
                            : 'border-[#E5E7EB] hover:border-[#F5A623] text-[#1B2F5E]'
                    }`}
                  >
                    <span className="font-extrabold mr-2">{opt.letter}.</span>
                    {opt.text}
                  </button>
                )
              })}
            </div>

            {!attempted ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!selected || submitting}
                className="w-full sm:w-auto px-8 py-3 bg-[#F5A623] text-white rounded-full text-sm font-extrabold hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? 'Submitting…' : 'Submit Answer'}
              </button>
            ) : (
              <div className="rounded-xl bg-[#FFFBF0] border-l-4 border-[#F5A623] p-4">
                {isCorrect ? (
                  <>
                    <p className="font-bold text-[#16a34a] mb-2">🎉 Correct! +50 stars!</p>
                    <p className="text-sm text-[#6B7280]">{question.explanation}</p>
                  </>
                ) : (
                  <>
                    <p className="font-bold text-[#1B2F5E] mb-2">
                      Not quite — keep learning!
                    </p>
                    <p className="text-sm text-[#6B7280] mb-2">
                      The correct answer was: <strong>{correctText}</strong>
                    </p>
                    <p className="text-sm text-[#6B7280] mb-2">{question.explanation}</p>
                    <p className="text-sm text-[#2AAFA0] font-semibold">
                      Come back tomorrow for a fresh challenge — you&apos;ve got this! 💪
                    </p>
                  </>
                )}
              </div>
            )}

            {error && <p className="mt-4 text-sm text-[#E85D4A] font-semibold">{error}</p>}
          </div>
        )}
      </div>
    </PublicLayout>
  )
}
