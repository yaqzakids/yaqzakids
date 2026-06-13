import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  addQuizQuestion,
  deleteQuizQuestion,
  ensureArticleQuiz,
  fetchQuizQuestions,
  updateQuizQuestion,
} from '@/lib/admin/articles'
import { logAdminAction } from '@/lib/admin/activity'
import {
  editableToQuizInput,
  emptyEditableQuestion,
  quizQuestionToEditable,
  validateEditableQuestion,
  type EditableQuizQuestion,
} from '@/lib/admin/quizzes'
import { adminBtn, adminCard, adminColors, adminInput, adminTextarea } from '@/lib/admin/styles'
import { dashboardTheme } from '@/lib/admin/dashboardTheme'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import type { QuizQuestion } from '@/lib/adventure/types'

const PASS_THRESHOLD = 70
const LETTERS = ['A', 'B', 'C', 'D'] as const
const OPTION_KEYS = ['optionA', 'optionB', 'optionC', 'optionD'] as const

interface ArticleQuizEditorProps {
  articleId: string
  articleTitle: string
}

function minQuestionsToPass(total: number, thresholdPercent: number): number {
  if (total === 0) return 0
  return Math.ceil((total * thresholdPercent) / 100)
}

function QuestionListItem({
  question,
  index,
  onEdit,
  onDelete,
}: {
  question: QuizQuestion
  index: number
  onEdit: () => void
  onDelete: () => void
}) {
  const correctLetter = LETTERS[question.options.findIndex((o) => o.is_correct)] ?? '?'

  return (
    <div
      style={{
        border: `1px solid ${adminColors.border}`,
        borderRadius: 10,
        padding: 16,
        marginBottom: 12,
        background: '#fff',
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <h4
          style={{
            margin: 0,
            fontFamily: 'Playfair Display, serif',
            color: dashboardTheme.navy,
            fontSize: 16,
          }}
        >
          Question {index + 1}
        </h4>
        <div className="flex gap-2">
          <button type="button" style={adminBtn.secondary} onClick={onEdit}>
            Edit
          </button>
          <button type="button" style={adminBtn.danger} onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>

      <p style={{ margin: '0 0 12px', fontWeight: 600, color: adminColors.text, lineHeight: 1.5 }}>
        {question.question_text}
      </p>

      <ul style={{ margin: '0 0 12px', paddingLeft: 0, listStyle: 'none' }}>
        {question.options.map((option, i) => (
          <li
            key={i}
            style={{
              padding: '6px 0',
              fontSize: 14,
              color: option.is_correct ? adminColors.success : adminColors.text,
              fontWeight: option.is_correct ? 700 : 400,
            }}
          >
            {LETTERS[i]}. {option.text}
            {option.is_correct && (
              <span
                style={{
                  marginLeft: 8,
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: adminColors.success,
                  background: adminColors.successBg,
                  padding: '2px 8px',
                  borderRadius: 999,
                }}
              >
                Correct
              </span>
            )}
          </li>
        ))}
      </ul>

      {question.explanation && (
        <p style={{ margin: 0, fontSize: 13, color: adminColors.muted, fontStyle: 'italic' }}>
          Explanation: {question.explanation}
        </p>
      )}

      <p style={{ margin: '8px 0 0', fontSize: 12, color: adminColors.muted }}>
        Correct answer: <strong>{correctLetter}</strong>
      </p>
    </div>
  )
}

export default function ArticleQuizEditor({ articleId, articleTitle }: ArticleQuizEditorProps) {
  const [quizId, setQuizId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState<EditableQuizQuestion>(emptyEditableQuestion())
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<string[]>([])
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const minToPass = useMemo(
    () => minQuestionsToPass(questions.length, PASS_THRESHOLD),
    [questions.length],
  )

  const loadQuestions = useCallback(async () => {
    setLoading(true)
    try {
      const qid = await ensureArticleQuiz(articleId, articleTitle)
      setQuizId(qid)
      setQuestions(await fetchQuizQuestions(qid))
    } catch {
      setStatusMessage('Failed to load quiz questions.')
    } finally {
      setLoading(false)
    }
  }, [articleId, articleTitle])

  useEffect(() => {
    loadQuestions()
  }, [loadQuestions])

  const resetForm = () => {
    setForm(emptyEditableQuestion())
    setEditingQuestionId(null)
    setFormErrors([])
  }

  const handleEdit = (question: QuizQuestion) => {
    const editable = quizQuestionToEditable(question)
    setForm(editable)
    setEditingQuestionId(question.id)
    setFormErrors([])
    setStatusMessage(null)
  }

  const handleSaveQuestion = async () => {
    const errors = validateEditableQuestion(form, editingQuestionId ? questions.findIndex((q) => q.id === editingQuestionId) : questions.length)
    if (errors.length) {
      setFormErrors(errors)
      return
    }

    setFormErrors([])
    setSaving(true)
    setStatusMessage(null)

    try {
      let qid = quizId
      if (!qid) {
        qid = await ensureArticleQuiz(articleId, articleTitle)
        setQuizId(qid)
      }

      const input = editableToQuizInput(form)

      if (editingQuestionId) {
        await updateQuizQuestion(editingQuestionId, input)
        await logAdminAction('quiz_updated', 'article', articleId, {
          title: articleTitle,
          question_id: editingQuestionId,
        })
        setStatusMessage('Question updated.')
      } else {
        await addQuizQuestion(qid, input, questions.length)
        await logAdminAction('quiz_updated', 'article', articleId, {
          title: articleTitle,
          action: 'question_added',
        })
        setStatusMessage('Question saved.')
      }

      resetForm()
      await loadQuestions()
    } catch {
      setStatusMessage('Save failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return
    setDeleting(true)
    setStatusMessage(null)
    try {
      await deleteQuizQuestion(confirmDeleteId)
      await logAdminAction('quiz_updated', 'article', articleId, {
        title: articleTitle,
        action: 'question_deleted',
        question_id: confirmDeleteId,
      })
      if (editingQuestionId === confirmDeleteId) {
        resetForm()
      }
      setConfirmDeleteId(null)
      setStatusMessage('Question deleted.')
      await loadQuestions()
    } catch {
      setStatusMessage('Delete failed. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ ...adminCard, marginBottom: 16 }}>
        <p style={{ margin: 0, color: adminColors.muted }}>Loading quiz questions…</p>
      </div>
    )
  }

  return (
    <div style={{ ...adminCard, marginBottom: 16 }}>
      <h3
        style={{
          margin: '0 0 16px',
          fontFamily: 'Playfair Display, serif',
          color: dashboardTheme.navy,
          fontSize: 22,
        }}
      >
        Quiz
      </h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 12,
          marginBottom: 20,
          padding: 16,
          borderRadius: 10,
          background: '#FFFBF0',
          border: `1px solid ${dashboardTheme.gold}`,
        }}
      >
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: adminColors.muted, textTransform: 'uppercase' }}>
            Total questions
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: dashboardTheme.navy }}>{questions.length}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: adminColors.muted, textTransform: 'uppercase' }}>
            Pass threshold
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: dashboardTheme.navy }}>{PASS_THRESHOLD}%</div>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: adminColors.muted, textTransform: 'uppercase' }}>
            Min. to pass
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: dashboardTheme.navy }}>
            {minToPass} of {questions.length || '—'}
          </div>
        </div>
      </div>

      {statusMessage && (
        <p
          style={{
            margin: '0 0 16px',
            fontSize: 14,
            color: statusMessage.includes('failed') ? adminColors.danger : adminColors.success,
          }}
        >
          {statusMessage}
        </p>
      )}

      <h4 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: dashboardTheme.navy }}>
        Questions
      </h4>

      {questions.length === 0 ? (
        <p style={{ margin: '0 0 20px', color: adminColors.muted, fontSize: 14 }}>
          No quiz questions yet. Add your first question below.
        </p>
      ) : (
        <div style={{ marginBottom: 24 }}>
          {questions.map((question, index) => (
            <QuestionListItem
              key={question.id}
              question={question}
              index={index}
              onEdit={() => handleEdit(question)}
              onDelete={() => setConfirmDeleteId(question.id)}
            />
          ))}
        </div>
      )}

      <div
        style={{
          borderTop: `1px solid ${adminColors.border}`,
          paddingTop: 20,
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: dashboardTheme.navy }}>
            {editingQuestionId ? 'Edit Question' : 'Add Question'}
          </h4>
          {editingQuestionId && (
            <button type="button" style={adminBtn.secondary} onClick={resetForm}>
              Cancel edit
            </button>
          )}
        </div>

        {formErrors.length > 0 && (
          <ul style={{ margin: '0 0 12px', paddingLeft: 18, color: adminColors.danger, fontSize: 13 }}>
            {formErrors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        )}

        <label className="block text-sm font-semibold mb-1">Question text</label>
        <textarea
          style={adminTextarea}
          value={form.question_text}
          onChange={(e) => setForm({ ...form, question_text: e.target.value })}
          placeholder="Enter the question…"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          {OPTION_KEYS.map((key, i) => (
            <div key={key}>
              <label className="block text-sm font-semibold mb-1">Option {LETTERS[i]}</label>
              <input
                style={{
                  ...adminInput,
                  borderColor: form.correct === LETTERS[i] ? dashboardTheme.gold : undefined,
                }}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={`Option ${LETTERS[i]}`}
              />
            </div>
          ))}
        </div>

        <label className="block text-sm font-semibold mb-1 mt-3">Correct answer</label>
        <select
          style={adminInput}
          value={form.correct}
          onChange={(e) => setForm({ ...form, correct: e.target.value as EditableQuizQuestion['correct'] })}
        >
          {LETTERS.map((letter) => (
            <option key={letter} value={letter}>
              {letter}
            </option>
          ))}
        </select>

        <label className="block text-sm font-semibold mb-1 mt-3">Explanation</label>
        <textarea
          style={adminTextarea}
          value={form.explanation}
          onChange={(e) => setForm({ ...form, explanation: e.target.value })}
          placeholder="Shown to the child after they answer…"
        />

        <button
          type="button"
          style={{ ...adminBtn.primary, marginTop: 12, opacity: saving ? 0.7 : 1 }}
          disabled={saving}
          onClick={handleSaveQuestion}
        >
          {saving ? 'Saving…' : editingQuestionId ? 'Update Question' : 'Save Question'}
        </button>
      </div>

      <ConfirmDialog
        open={!!confirmDeleteId}
        title="Delete question?"
        message="This will permanently remove the question from the quiz."
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  )
}
