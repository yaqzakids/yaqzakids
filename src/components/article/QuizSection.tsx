import { useState } from 'react'
import type { Quiz } from '../../lib/types'
import { updateChildXP } from '../../lib/supabase'

interface QuizSectionProps {
  quizzes: Quiz[]
  childId?: string
  onComplete?: (totalXP: number) => void
}

export default function QuizSection({ quizzes, childId, onComplete }: QuizSectionProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [showXP, setShowXP] = useState(false)
  const [totalXP, setTotalXP] = useState(0)

  if (quizzes.length === 0) return null

  const handleSubmit = async () => {
    let earned = 0
    quizzes.forEach((q) => {
      if (answers[q.id] === q.correct_answer) {
        earned += q.xp_reward
      }
    })
    setTotalXP(earned)
    setSubmitted(true)
    setShowXP(true)

    if (childId && earned > 0) {
      await updateChildXP(childId, earned)
    }
    onComplete?.(earned)
  }

  return (
    <section className="mt-12">
      <h2 className="font-display text-2xl font-bold text-navy mb-6">Quiz Time! 🎯</h2>

      {quizzes.map((quiz) => (
        <div key={quiz.id} className="bg-white rounded-xl p-6 mb-5 border border-gray-200">
          <h3 className="font-display text-xl font-bold text-navy mb-4">{quiz.question_en}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(['A', 'B', 'C', 'D'] as const).map((letter) => {
              const optionKey = `option_${letter.toLowerCase()}_en` as keyof Quiz
              const optionText = quiz[optionKey] as string
              const isSelected = answers[quiz.id] === letter
              const isCorrect = submitted && letter === quiz.correct_answer
              const isWrong = submitted && isSelected && letter !== quiz.correct_answer

              return (
                <button
                  key={letter}
                  disabled={submitted}
                  onClick={() => setAnswers({ ...answers, [quiz.id]: letter })}
                  className={`p-3 rounded-xl border-2 text-left text-sm font-semibold transition-colors ${
                    isCorrect ? 'border-green-500 bg-green-50 text-green-700'
                    : isWrong ? 'border-red-400 bg-red-50 text-red-700'
                    : isSelected ? 'border-gold bg-gold/10 text-navy'
                    : 'border-navy/20 text-navy hover:border-gold'
                  }`}
                >
                  <span className="font-bold mr-2">{letter}.</span> {optionText}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={Object.keys(answers).length < quizzes.length}
          className="bg-gold text-white px-8 py-3 rounded-full font-extrabold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          Submit Quiz
        </button>
      ) : showXP && (
        <div className="xp-animation text-center py-8">
          <p className="text-4xl mb-2">🎉</p>
          <p className="font-display text-2xl font-bold text-gold">+{totalXP} XP Earned!</p>
          <p className="text-muted mt-2">Great job! Keep learning!</p>
        </div>
      )}
    </section>
  )
}
