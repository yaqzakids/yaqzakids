import { supabase } from '@/lib/supabase'
import { logAdminAction } from './activity'
import type { AdventureArticle } from '@/lib/adventure/types'
import type { Pillar } from '@/lib/adventure/types'
import type { QuizQuestion } from '@/lib/adventure/types'
import { slugify } from './utils'
import {
  articleToLocalesI18n,
  localesToLegacyColumns,
} from './articleI18n'
import type { ArticleLocalesI18n } from '@/types/articleLocales'
import type { ArticleFunFact, ArticleVocabEntry, UsulTheme } from '@/lib/types'

export interface AdminArticleListItem {
  id: string
  title: string
  slug: string
  published: boolean
  reading_time_minutes: number
  created_at: string
  usul_theme?: UsulTheme | null
  pillar: { id: string; name: string } | null
}

export interface AdminArticleForm {
  title: string
  slug: string
  pillar_id: string
  published: boolean
  cover_image_url: string
  reading_time_minutes: number
  source_name: string
  source_url: string
  locales: ArticleLocalesI18n
  usul_theme: UsulTheme | ''
  quran_connection: string
  quran_reference: string
  hadith_connection: string
  hadith_reference: string
  islamic_reflection: string
  take_action: string
  reflection_question: string
  think_about_it: string[]
  fun_facts: ArticleFunFact[]
  vocabulary: ArticleVocabEntry[]
  quran_connection_i18n: Record<string, string>
  islamic_reflection_i18n: Record<string, string>
  think_about_it_i18n: Record<string, string[]>
  take_action_i18n: Record<string, string>
}

export async function fetchAdminArticles(): Promise<AdminArticleListItem[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('id, title, slug, published, reading_time_minutes, created_at, usul_theme, pillar:pillars(id, name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => ({
    ...row,
    pillar: (Array.isArray(row.pillar) ? row.pillar[0] : row.pillar) as AdminArticleListItem['pillar'],
  })) as AdminArticleListItem[]
}

export async function fetchAdminPillars(): Promise<Pillar[]> {
  const { data, error } = await supabase.from('pillars').select('*').order('sort_order')
  if (error) throw error
  return data ?? []
}

export async function fetchAdminArticle(id: string): Promise<AdventureArticle> {
  const { data, error } = await supabase.from('articles').select('*').eq('id', id).single()
  if (error) throw error
  return data as AdventureArticle
}

export function articleToForm(article: AdventureArticle): AdminArticleForm {
  const locales = articleToLocalesI18n(article)
  const enTitle = locales.en?.title ?? article.title ?? ''
  return {
    title: enTitle,
    slug: article.slug ?? '',
    pillar_id: article.pillar_id ?? '',
    published: article.published ?? false,
    cover_image_url: article.cover_image_url ?? '',
    reading_time_minutes: article.reading_time_minutes ?? 5,
    source_name: article.source_name ?? '',
    source_url: article.source_url ?? '',
    locales,
    usul_theme: article.usul_theme ?? '',
    quran_connection: article.quran_connection ?? '',
    quran_reference: article.quran_reference ?? '',
    hadith_connection: article.hadith_connection ?? '',
    hadith_reference: article.hadith_reference ?? '',
    islamic_reflection: article.islamic_reflection ?? '',
    take_action: article.take_action ?? '',
    reflection_question: article.reflection_question ?? '',
    think_about_it: article.think_about_it?.slice(0, 3) ?? ['', '', ''],
    fun_facts: article.fun_facts?.slice(0, 5) ?? [],
    vocabulary: article.vocabulary?.slice(0, 5) ?? [],
    quran_connection_i18n: article.quran_connection_i18n ?? {},
    islamic_reflection_i18n: article.islamic_reflection_i18n ?? {},
    think_about_it_i18n: article.think_about_it_i18n ?? {},
    take_action_i18n: article.take_action_i18n ?? {},
  }
}

export function formToArticlePayload(form: AdminArticleForm) {
  const legacy = localesToLegacyColumns(form.locales)
  return {
    title: legacy.title || form.title,
    slug: form.slug || slugify(legacy.title || form.title),
    pillar_id: form.pillar_id,
    published: form.published,
    cover_image_url: form.cover_image_url || null,
    reading_time_minutes: form.reading_time_minutes,
    source_name: form.source_name || null,
    source_url: form.source_url || null,
    content_explorer: legacy.content_explorer,
    content_discoverer: legacy.content_discoverer,
    content_thinker: legacy.content_thinker,
    islamic_teaching: legacy.islamic_teaching,
    think_about_it: form.think_about_it.filter(Boolean).length
      ? form.think_about_it.filter(Boolean)
      : legacy.think_about_it,
    activity: legacy.activity,
    locales_i18n: form.locales,
    usul_theme: form.usul_theme || null,
    quran_connection: form.quran_connection || null,
    quran_reference: form.quran_reference || null,
    hadith_connection: form.hadith_connection || null,
    hadith_reference: form.hadith_reference || null,
    islamic_reflection: form.islamic_reflection || null,
    take_action: form.take_action || null,
    reflection_question: form.reflection_question || null,
    fun_facts: form.fun_facts.filter((f) => f.fact.trim()),
    vocabulary: form.vocabulary.filter((v) => v.word.trim()),
    quran_connection_i18n: form.quran_connection_i18n,
    islamic_reflection_i18n: form.islamic_reflection_i18n,
    think_about_it_i18n: form.think_about_it_i18n,
    take_action_i18n: form.take_action_i18n,
  }
}

export async function createAdminArticle(form: AdminArticleForm): Promise<string> {
  const payload = formToArticlePayload(form)
  const { data, error } = await supabase.from('articles').insert(payload).select('id').single()
  if (error) throw error
  await supabase.from('quizzes').insert({ article_id: data.id, title: `${payload.title} Quiz` })
  await logAdminAction('article_created', 'article', data.id, { title: payload.title })
  return data.id
}

export async function updateAdminArticle(id: string, form: AdminArticleForm): Promise<void> {
  const payload = formToArticlePayload(form)
  const { error } = await supabase.from('articles').update(payload).eq('id', id)
  if (error) throw error
  await logAdminAction('article_updated', 'article', id, { title: payload.title })
}

export async function setArticlePublished(id: string, published: boolean): Promise<void> {
  const { error } = await supabase.from('articles').update({ published }).eq('id', id)
  if (error) throw error
  await logAdminAction(published ? 'article_published' : 'article_unpublished', 'article', id)
}

export async function deleteAdminArticle(id: string): Promise<void> {
  const { error } = await supabase.from('articles').delete().eq('id', id)
  if (error) throw error
  await logAdminAction('article_deleted', 'article', id)
}

export async function fetchArticleQuiz(articleId: string) {
  const { data } = await supabase.from('quizzes').select('*').eq('article_id', articleId).maybeSingle()
  return data
}

export async function fetchQuizQuestions(quizId: string): Promise<QuizQuestion[]> {
  const { data, error } = await supabase
    .from('quiz_questions')
    .select('*')
    .eq('quiz_id', quizId)
    .order('sort_order')
  if (error) throw error
  return (data ?? []).map((q) => ({ ...q, options: q.options as QuizQuestion['options'] }))
}

export interface QuizQuestionInput {
  question_text: string
  options: { text: string; is_correct: boolean }[]
  explanation: string
}

export async function addQuizQuestion(quizId: string, input: QuizQuestionInput, sortOrder: number): Promise<void> {
  const { error } = await supabase.from('quiz_questions').insert({
    quiz_id: quizId,
    question_text: input.question_text,
    options: input.options,
    explanation: input.explanation,
    sort_order: sortOrder,
  })
  if (error) throw error
}

export async function updateQuizQuestion(id: string, input: QuizQuestionInput): Promise<void> {
  const { error } = await supabase.from('quiz_questions').update({
    question_text: input.question_text,
    options: input.options,
    explanation: input.explanation,
  }).eq('id', id)
  if (error) throw error
}

export async function deleteQuizQuestion(id: string): Promise<void> {
  const { error } = await supabase.from('quiz_questions').delete().eq('id', id)
  if (error) throw error
}

export async function ensureArticleQuiz(articleId: string, title: string): Promise<string> {
  const existing = await fetchArticleQuiz(articleId)
  if (existing) return existing.id
  const { data, error } = await supabase
    .from('quizzes')
    .insert({ article_id: articleId, title: `${title} Quiz` })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}
