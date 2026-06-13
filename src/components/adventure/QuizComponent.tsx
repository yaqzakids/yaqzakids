import { useEffect, useMemo, useState } from 'react'
import {
  fetchQuizQuestions,
  shuffleOptions,
  shuffleQuestions,
  submitQuizAttempt,
} from '@/lib/adventure/service'
import { QUIZ_PASSING_SCORE } from '@/lib/adventure/constants'
import type { QuizOption, QuizQuestion } from '@/lib/adventure/types'
import LoadingSpinner from '@/components/LoadingSpinner'
import { buildQuizQuestionText } from '@/lib/voice/readAloudText'
import ReadAloudPlayer from '@/components/voice/ReadAloudPlayer'

interface ShuffledQuestion extends QuizQuestion {
  shuffledOptions: QuizOption[]
}

interface QuizComponentProps {
  childId: string
  quizId: string
  language?: 'en' | 'fr' | 'ar'
  onPassed?: () => void
}

export default function QuizComponent({ childId, quizId, language = 'en', onPassed }: QuizComponentProps) {
  const [questions, setQuestions] = useState<ShuffledQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [passed, setPassed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [loading, setLoading] = useState(true)
  const [explanations, setExplanations] = useState<Record<string, string>>({})

  const loadQuestions = async () => {
    setLoading(true)
    const qs = await fetchQuizQuestions(quizId)
    const shuffled = shuffleQuestions(qs).map((q) => ({
      ...q,
      shuffledOptions: shuffleOptions(q.options),
    }))
    setQuestions(shuffled)
    setAnswers({})
    setSubmitted(false)
    setExplanations({})
    setLoading(false)
  }

  useEffect(() => {
    loadQuestions()
  }, [quizId, attempt])

  const allAnswered = useMemo(
    () => questions.length > 0 && questions.every((q) => answers[q.id] !== undefined),
    [questions, answers]
  )

  const handleSubmit = async () => {
    let correct = 0
    const newExplanations: Record<string, string> = {}

    questions.forEach((q) => {
      const selectedIdx = answers[q.id]
      const selected = q.shuffledOptions[selectedIdx]
      if (selected?.is_correct) correct++
      newExplanations[q.id] = q.explanation
    })

    const scorePct = questions.length ? Math.round((correct / questions.length) * 100) : 0
    setScore(scorePct)
    setExplanations(newExplanations)
    setSubmitted(true)

    const result = await submitQuizAttempt(childId, quizId, scorePct, answers)
    const didPass = scorePct >= QUIZ_PASSING_SCORE
    setPassed(didPass)
    if (didPass) onPassed?.()
    void result
  }

  const handleRetry = () => {
    setAttempt((a) => a + 1)
  }

  if (loading) return <LoadingSpinner />

  if (questions.length === 0) {
    return <p className="text-muted text-sm">No quiz questions for this article yet.</p>
  }

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold text-navy">🎯 Adventure Quiz</h2>
      <p className="text-sm text-muted">Pass with {QUIZ_PASSING_SCORE}% or higher to earn ⭐ 25 Stars. Unlimited retries!</p>

      {questions.map((q, qi) => (
        <div key={q.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex flex-wrap justify-between items-start gap-3 mb-3">
            <p className="font-bold text-navy flex-1">
              {qi + 1}. {q.question_text}
            </p>
            <ReadAloudPlayer
              variant="compact"
              label="Read Question"
              content={buildQuizQuestionText(q.question_text, q.shuffledOptions.map((opt) => opt.text))}
              language={language}
              cacheKeyPrefix={`quiz:${quizId}:${q.id}`}
            />
          </div>
          <div className="space-y-2">
            {q.shuffledOptions.map((opt, oi) => {
              const selected = answers[q.id] === oi
              const showResult = submitted
              const isCorrect = opt.is_correct
              return (
                <button
                  key={oi}
                  type="button"
                  disabled={submitted}
                  onClick={() => setAnswers({ ...answers, [q.id]: oi })}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-colors ${
                    showResult && isCorrect
                      ? 'border-teal bg-teal/10 text-teal'
                      : showResult && selected && !isCorrect
                      ? 'border-coral bg-coral/10 text-coral'
                      : selected
                      ? 'border-gold bg-gold/10 text-navy'
                      : 'border-gray-200 hover:border-gold text-navy'
                  }`}
                >
                  {opt.text}
                </button>
              )
            })}
          </div>
          {submitted && explanations[q.id] && (
            <p className="mt-3 text-sm text-muted bg-[#FFFBF0] rounded-xl p-3 border-l-4 border-gold">
              💡 {explanations[q.id]}
            </p>
          )}
        </div>
      ))}

      {!submitted ? (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!allAnswered}
          className="bg-gold text-white px-8 py-3 rounded-full font-extrabold disabled:opacity-50 hover:opacity-90"
        >
          Submit Quiz
        </button>
      ) : (
        <div className="text-center py-6">
          <p className="text-4xl mb-2">{passed ? '🎉' : '💪'}</p>
          <p className="font-display text-2xl font-bold text-navy">Score: {score}%</p>
          {passed ? (
            <p className="text-gold font-bold mt-2">⭐ +25 Stars! Quiz passed!</p>
          ) : (
            <>
              <p className="text-muted mt-2">Keep trying — you need {QUIZ_PASSING_SCORE}% to pass.</p>
              <button
                type="button"
                onClick={handleRetry}
                className="mt-4 bg-navy text-white px-6 py-3 rounded-full font-bold hover:opacity-90"
              >
                Try Again (questions shuffled)
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
