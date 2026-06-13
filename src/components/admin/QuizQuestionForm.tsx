import { adminBtn, adminInput, adminTextarea } from '@/lib/admin/styles'
import { dashboardTheme } from '@/lib/admin/dashboardTheme'
import type { EditableQuizQuestion } from '@/lib/admin/quizzes'

const LETTERS = ['A', 'B', 'C', 'D'] as const
const OPTION_KEYS = ['optionA', 'optionB', 'optionC', 'optionD'] as const

interface QuizQuestionFormProps {
  index: number
  total: number
  question: EditableQuizQuestion
  onChange: (next: EditableQuizQuestion) => void
  onMoveUp: () => void
  onMoveDown: () => void
  onDelete: () => void
  errors?: string[]
}

export default function QuizQuestionForm({
  index,
  total,
  question,
  onChange,
  onMoveUp,
  onMoveDown,
  onDelete,
  errors = [],
}: QuizQuestionFormProps) {
  return (
    <div
      style={{
        border: `1px solid ${errors.length ? '#FCA5A5' : '#E8E4DC'}`,
        borderRadius: 14,
        padding: 20,
        marginBottom: 16,
        background: '#FFFCF7',
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h4 style={{ margin: 0, fontFamily: 'Playfair Display, serif', color: dashboardTheme.navy, fontSize: 17 }}>
          Question {index + 1}
        </h4>
        <div className="flex flex-wrap gap-2">
          <button type="button" style={adminBtn.secondary} disabled={index === 0} onClick={onMoveUp}>
            ↑ Move Up
          </button>
          <button type="button" style={adminBtn.secondary} disabled={index === total - 1} onClick={onMoveDown}>
            ↓ Move Down
          </button>
          <button type="button" style={adminBtn.danger} onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>

      {errors.length > 0 && (
        <ul style={{ margin: '0 0 12px', paddingLeft: 18, color: '#DC2626', fontSize: 13 }}>
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      <label className="block text-sm font-semibold mb-1">Question text</label>
      <textarea
        style={adminTextarea}
        value={question.question_text}
        onChange={(e) => onChange({ ...question, question_text: e.target.value })}
        placeholder="Enter the question…"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
        {OPTION_KEYS.map((key, i) => (
          <div key={key}>
            <label className="block text-sm font-semibold mb-1">Option {LETTERS[i]}</label>
            <input
              style={{
                ...adminInput,
                borderColor: question.correct === LETTERS[i] ? dashboardTheme.gold : undefined,
              }}
              value={question[key]}
              onChange={(e) => onChange({ ...question, [key]: e.target.value })}
              placeholder={`Option ${LETTERS[i]}`}
            />
          </div>
        ))}
      </div>

      <label className="block text-sm font-semibold mb-1 mt-3">Correct answer</label>
      <select
        style={adminInput}
        value={question.correct}
        onChange={(e) => onChange({ ...question, correct: e.target.value as EditableQuizQuestion['correct'] })}
      >
        {LETTERS.map((l) => (
          <option key={l} value={l}>
            {l}
          </option>
        ))}
      </select>

      <label className="block text-sm font-semibold mb-1 mt-3">Explanation</label>
      <textarea
        style={adminTextarea}
        value={question.explanation}
        onChange={(e) => onChange({ ...question, explanation: e.target.value })}
        placeholder="Explain why the correct answer is right…"
      />
    </div>
  )
}
