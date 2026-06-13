import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  emptyEditableQuestion,
  fetchQuizEditorMeta,
  loadEditableQuizQuestions,
  saveAllQuizQuestions,
  validateEditableQuestion,
  type EditableQuizQuestion,
  type QuizEditorMeta,
} from '@/lib/admin/quizzes'
import { adminBtn } from '@/lib/admin/styles'
import { dashboardCard, dashboardTheme } from '@/lib/admin/dashboardTheme'
import { CardSkeleton } from '@/components/admin/AdminSkeleton'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import AdminToast from '@/components/admin/AdminToast'
import QuizQuestionForm from '@/components/admin/QuizQuestionForm'
import StatusBadge from '@/components/admin/StatusBadge'

function swapItems<T>(items: T[], from: number, to: number): T[] {
  const next = [...items]
  const [removed] = next.splice(from, 1)
  next.splice(to, 0, removed)
  return next
}

function QuizPreview({ questions }: { questions: EditableQuizQuestion[] }) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  if (questions.length === 0) {
    return <p style={{ color: dashboardTheme.muted }}>Add questions to preview the quiz.</p>
  }

  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: dashboardTheme.muted }}>
        Preview mode — answers are not saved. This is how children will see the quiz.
      </p>
      {questions.map((q, qi) => (
        <div key={q.clientId} style={{ border: '1px solid #E8E4DC', borderRadius: 14, padding: 16, background: '#fff' }}>
          <p className="font-bold mb-3" style={{ color: dashboardTheme.navy, fontFamily: 'Playfair Display, serif' }}>
            {qi + 1}. {q.question_text || '(empty question)'}
          </p>
          <div className="space-y-2">
            {(['A', 'B', 'C', 'D'] as const).map((letter, i) => {
              const text = [q.optionA, q.optionB, q.optionC, q.optionD][i]
              const selected = answers[q.clientId] === letter
              const isCorrect = q.correct === letter
              return (
                <button
                  key={letter}
                  type="button"
                  disabled={submitted}
                  onClick={() => setAnswers({ ...answers, [q.clientId]: letter })}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px 16px',
                    borderRadius: 12,
                    border: `2px solid ${
                      submitted && isCorrect
                        ? dashboardTheme.teal
                        : submitted && selected && !isCorrect
                        ? '#F87171'
                        : selected
                        ? dashboardTheme.gold
                        : '#E8E4DC'
                    }`,
                    background: submitted && isCorrect ? '#E6F7F5' : selected ? '#FFF9DB' : '#fff',
                    cursor: submitted ? 'default' : 'pointer',
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  {letter}. {text || '(empty)'}
                </button>
              )
            })}
          </div>
          {submitted && q.explanation && (
            <p className="mt-3 text-sm rounded-xl p-3" style={{ background: '#FFFBF0', borderLeft: `4px solid ${dashboardTheme.gold}` }}>
              💡 {q.explanation}
            </p>
          )}
        </div>
      ))}
      {!submitted ? (
        <button
          type="button"
          style={adminBtn.primary}
          disabled={questions.some((q) => !answers[q.clientId])}
          onClick={() => setSubmitted(true)}
        >
          Check Answers (Preview)
        </button>
      ) : (
        <button type="button" style={adminBtn.secondary} onClick={() => { setSubmitted(false); setAnswers({}) }}>
          Reset Preview
        </button>
      )}
    </div>
  )
}

export default function AdminQuizEditorPage() {
  const { articleId } = useParams<{ articleId: string }>()
  const [meta, setMeta] = useState<QuizEditorMeta | null>(null)
  const [questions, setQuestions] = useState<EditableQuizQuestion[]>([])
  const [deletedIds, setDeletedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({})

  const load = async () => {
    if (!articleId) return
    setLoading(true)
    try {
      const [m, qs] = await Promise.all([
        fetchQuizEditorMeta(articleId),
        loadEditableQuizQuestions(articleId),
      ])
      setMeta(m)
      setQuestions(qs)
      setDeletedIds([])
      setValidationErrors({})
    } catch {
      setToast({ message: 'Failed to load quiz.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [articleId])

  const fieldErrors = useMemo(() => validationErrors, [validationErrors])

  const addQuestion = () => {
    setQuestions((prev) => [...prev, emptyEditableQuestion()])
  }

  const updateQuestion = (clientId: string, next: EditableQuizQuestion) => {
    setQuestions((prev) => prev.map((q) => (q.clientId === clientId ? next : q)))
  }

  const moveQuestion = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= questions.length) return
    setQuestions((prev) => swapItems(prev, index, target))
  }

  const handleDelete = (clientId: string) => {
    setConfirmDelete(clientId)
  }

  const confirmDeleteQuestion = () => {
    if (!confirmDelete) return
    const q = questions.find((x) => x.clientId === confirmDelete)
    if (q?.id) setDeletedIds((prev) => [...prev, q.id!])
    setQuestions((prev) => prev.filter((x) => x.clientId !== confirmDelete))
    setConfirmDelete(null)
  }

  const handleSave = async () => {
    if (!articleId || !meta) return

    const errors: Record<string, string[]> = {}
    questions.forEach((q, i) => {
      const errs = validateEditableQuestion(q, i)
      if (errs.length) errors[q.clientId] = errs
    })

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      setToast({ message: 'Fix validation errors before saving.', type: 'error' })
      return
    }

    setValidationErrors({})
    setSaving(true)
    try {
      const count = await saveAllQuizQuestions(articleId, meta.title, questions, deletedIds)
      setToast({ message: `Quiz saved — ${count} question${count === 1 ? '' : 's'}.`, type: 'success' })
      await load()
    } catch {
      setToast({ message: 'Save failed. Please try again.', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <CardSkeleton count={3} />
  if (!meta) return <p style={{ color: '#DC2626' }}>Article not found.</p>

  return (
    <div>
      <Link
        to="/admin/quizzes"
        style={{ ...adminBtn.secondary, textDecoration: 'none', display: 'inline-block', marginBottom: 16 }}
      >
        ← Back to Quizzes
      </Link>

      <div style={{ ...dashboardCard, marginBottom: 16 }}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2
              style={{
                margin: '0 0 8px',
                fontFamily: 'Playfair Display, serif',
                color: dashboardTheme.navy,
                fontSize: 26,
              }}
            >
              {meta.title}
            </h2>
            <div className="text-sm space-y-1" style={{ color: dashboardTheme.muted }}>
              <div><strong>Slug:</strong> {meta.slug}</div>
              <div><strong>Path:</strong> {meta.pathTitle ?? '—'}</div>
              <div><strong>Pillar:</strong> {meta.pillarName ?? '—'}</div>
              <div><strong>Questions:</strong> {questions.length}</div>
            </div>
          </div>
          <StatusBadge label={meta.published ? 'Published' : 'Draft'} variant={meta.published ? 'success' : 'warning'} />
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <button type="button" style={adminBtn.primary} disabled={saving} onClick={handleSave}>
            {saving ? 'Saving…' : 'Save All Changes'}
          </button>
          <button type="button" style={adminBtn.secondary} onClick={() => setShowPreview((v) => !v)}>
            {showPreview ? 'Hide Preview' : 'Preview Quiz'}
          </button>
          <button type="button" style={adminBtn.secondary} onClick={addQuestion}>
            + Add Question
          </button>
        </div>
      </div>

      {showPreview && (
        <div style={{ ...dashboardCard, marginBottom: 16, border: `2px solid ${dashboardTheme.gold}` }}>
          <h3 style={{ margin: '0 0 16px', fontFamily: 'Playfair Display, serif', color: dashboardTheme.navy }}>
            Quiz Preview
          </h3>
          <QuizPreview questions={questions} />
        </div>
      )}

      {questions.length === 0 ? (
        <div style={{ ...dashboardCard, textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>❓</div>
          <p style={{ margin: '0 0 16px', fontWeight: 700, color: dashboardTheme.navy }}>
            No quiz questions yet. Add your first question.
          </p>
          <button type="button" style={adminBtn.primary} onClick={addQuestion}>
            + Add Question
          </button>
        </div>
      ) : (
        <>
          {questions.map((q, i) => (
            <QuizQuestionForm
              key={q.clientId}
              index={i}
              total={questions.length}
              question={q}
              errors={fieldErrors[q.clientId]}
              onChange={(next) => updateQuestion(q.clientId, next)}
              onMoveUp={() => moveQuestion(i, -1)}
              onMoveDown={() => moveQuestion(i, 1)}
              onDelete={() => handleDelete(q.clientId)}
            />
          ))}
          <div className="flex flex-wrap gap-2">
            <button type="button" style={adminBtn.secondary} onClick={addQuestion}>
              + Add Question
            </button>
            <button type="button" style={adminBtn.primary} disabled={saving} onClick={handleSave}>
              {saving ? 'Saving…' : 'Save All Changes'}
            </button>
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete question?"
        message="This question will be removed when you save. You can also save immediately after confirming."
        confirmLabel="Delete"
        danger
        onConfirm={confirmDeleteQuestion}
        onCancel={() => setConfirmDelete(null)}
      />

      {toast && <AdminToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
