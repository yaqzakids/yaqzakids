import { supabase } from '@/lib/supabase'
import { logAdminAction } from './activity'
import {
  addQuizQuestion,
  deleteQuizQuestion,
  ensureArticleQuiz,
  fetchArticleQuiz,
  fetchQuizQuestions,
  updateQuizQuestion,
  type QuizQuestionInput,
} from './articles'
import type { QuizQuestion } from '@/lib/adventure/types'

export interface AdminQuizArticleRow {
  id: string
  title: string
  slug: string
  published: boolean
  pillar: { id: string; name: string } | null
  pathTitle: string | null
  pathId: string | null
  questionCount: number
  quizId: string | null
}

export interface QuizEditorMeta {
  articleId: string
  title: string
  slug: string
  published: boolean
  pillarName: string | null
  pathTitle: string | null
  quizId: string
  questionCount: number
}

export interface EditableQuizQuestion {
  clientId: string
  id: string | null
  question_text: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correct: 'A' | 'B' | 'C' | 'D'
  explanation: string
}

export function quizQuestionToEditable(q: QuizQuestion): EditableQuizQuestion {
  const correctIdx = q.options.findIndex((o) => o.is_correct)
  const letters = ['A', 'B', 'C', 'D'] as const
  return {
    clientId: q.id,
    id: q.id,
    question_text: q.question_text,
    optionA: q.options[0]?.text ?? '',
    optionB: q.options[1]?.text ?? '',
    optionC: q.options[2]?.text ?? '',
    optionD: q.options[3]?.text ?? '',
    correct: letters[correctIdx >= 0 ? correctIdx : 0] ?? 'A',
    explanation: q.explanation,
  }
}

export function editableToQuizInput(q: EditableQuizQuestion): QuizQuestionInput {
  const opts = [
    { text: q.optionA.trim(), is_correct: q.correct === 'A' },
    { text: q.optionB.trim(), is_correct: q.correct === 'B' },
    { text: q.optionC.trim(), is_correct: q.correct === 'C' },
    { text: q.optionD.trim(), is_correct: q.correct === 'D' },
  ]
  return { question_text: q.question_text.trim(), options: opts, explanation: q.explanation.trim() }
}

export function validateEditableQuestion(q: EditableQuizQuestion, index: number): string[] {
  const errors: string[] = []
  const label = `Question ${index + 1}`
  if (!q.question_text.trim()) errors.push(`${label}: question text is required.`)
  if (!q.optionA.trim() || !q.optionB.trim() || !q.optionC.trim() || !q.optionD.trim()) {
    errors.push(`${label}: all 4 options are required.`)
  }
  if (!q.explanation.trim()) errors.push(`${label}: explanation is required.`)
  const opts = [q.optionA, q.optionB, q.optionC, q.optionD]
  if (!opts.some((_, i) => (['A', 'B', 'C', 'D'] as const)[i] === q.correct)) {
    errors.push(`${label}: select a correct answer.`)
  }
  return errors
}

export function emptyEditableQuestion(): EditableQuizQuestion {
  return {
    clientId: `new-${crypto.randomUUID()}`,
    id: null,
    question_text: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correct: 'A',
    explanation: '',
  }
}

export async function fetchQuizAdminArticles(): Promise<AdminQuizArticleRow[]> {
  const [{ data: articles, error }, { data: quizzes }, { data: pathLinks }] = await Promise.all([
    supabase
      .from('articles')
      .select('id, title, slug, published, pillar:pillars(id, name)')
      .order('title'),
    supabase.from('quizzes').select('id, article_id'),
    supabase.from('path_articles').select('article_id, path:adventure_paths(id, title)'),
  ])
  if (error) throw error

  const quizByArticle = Object.fromEntries((quizzes ?? []).map((q) => [q.article_id, q.id]))
  const quizIds = (quizzes ?? []).map((q) => q.id)

  let questionCounts: Record<string, number> = {}
  if (quizIds.length > 0) {
    const { data: questions } = await supabase.from('quiz_questions').select('quiz_id').in('quiz_id', quizIds)
    questionCounts = (questions ?? []).reduce<Record<string, number>>((acc, row) => {
      acc[row.quiz_id] = (acc[row.quiz_id] ?? 0) + 1
      return acc
    }, {})
  }

  const pathByArticle: Record<string, { id: string; title: string }> = {}
  ;(pathLinks ?? []).forEach((link) => {
    const path = Array.isArray(link.path) ? link.path[0] : link.path
    if (path && !pathByArticle[link.article_id]) {
      pathByArticle[link.article_id] = { id: path.id, title: path.title }
    }
  })

  return (articles ?? []).map((row) => {
    const pillar = Array.isArray(row.pillar) ? row.pillar[0] : row.pillar
    const quizId = quizByArticle[row.id] ?? null
    const path = pathByArticle[row.id] ?? null
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      published: row.published,
      pillar: pillar ?? null,
      pathTitle: path?.title ?? null,
      pathId: path?.id ?? null,
      questionCount: quizId ? (questionCounts[quizId] ?? 0) : 0,
      quizId,
    }
  })
}

export async function fetchQuizEditorMeta(articleId: string): Promise<QuizEditorMeta> {
  const { data: article, error } = await supabase
    .from('articles')
    .select('id, title, slug, published, pillar:pillars(name)')
    .eq('id', articleId)
    .single()
  if (error) throw error

  const { data: pathLink } = await supabase
    .from('path_articles')
    .select('path:adventure_paths(title)')
    .eq('article_id', articleId)
    .limit(1)
    .maybeSingle()

  const path = pathLink?.path
    ? (Array.isArray(pathLink.path) ? pathLink.path[0] : pathLink.path)
    : null

  const quizId = await ensureArticleQuiz(articleId, article.title)
  const questions = await fetchQuizQuestions(quizId)
  const pillar = Array.isArray(article.pillar) ? article.pillar[0] : article.pillar

  return {
    articleId,
    title: article.title,
    slug: article.slug,
    published: article.published,
    pillarName: pillar?.name ?? null,
    pathTitle: path?.title ?? null,
    quizId,
    questionCount: questions.length,
  }
}

export async function loadEditableQuizQuestions(articleId: string): Promise<EditableQuizQuestion[]> {
  const quiz = await fetchArticleQuiz(articleId)
  if (!quiz) return []
  const questions = await fetchQuizQuestions(quiz.id)
  return questions.map(quizQuestionToEditable)
}

export async function saveAllQuizQuestions(
  articleId: string,
  articleTitle: string,
  questions: EditableQuizQuestion[],
  deletedIds: string[],
): Promise<number> {
  const quizId = await ensureArticleQuiz(articleId, articleTitle)

  for (const id of deletedIds) {
    await deleteQuizQuestion(id)
  }

  for (let i = 0; i < questions.length; i++) {
    const input = editableToQuizInput(questions[i])
    if (questions[i].id) {
      await updateQuizQuestion(questions[i].id!, input)
      await supabase.from('quiz_questions').update({ sort_order: i }).eq('id', questions[i].id!)
    } else {
      await addQuizQuestion(quizId, input, i)
    }
  }

  await logAdminAction('quiz_updated', 'article', articleId, {
    title: articleTitle,
    question_count: questions.length,
  })

  return questions.length
}

export async function fetchAdminPathOptions(): Promise<{ id: string; title: string }[]> {
  const { data, error } = await supabase.from('adventure_paths').select('id, title').order('title')
  if (error) throw error
  return data ?? []
}

export async function fetchAdminPillarOptions(): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase.from('pillars').select('id, name').order('sort_order')
  if (error) throw error
  return data ?? []
}
