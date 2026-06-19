import { supabase } from '@/lib/supabase'
import { logAdminAction } from './activity'
import type { AdventurePath, Pillar } from '@/lib/adventure/types'

export interface AdminPathListItem {
  id: string
  pillar_id: string
  title: string
  slug: string
  public_slug?: string | null
  icon?: string | null
  description: string | null
  difficulty_level: 'easy' | 'medium' | 'hard'
  is_free: boolean
  badge_reward_id: string | null
  cover_image_url: string | null
  sort_order: number
  status?: 'draft' | 'published' | 'archived'
  pillar: Pillar | null
  article_count: number
}

export interface AdminPathForm {
  title: string
  slug: string
  public_slug: string
  description: string
  full_description: string
  mission_statement: string
  icon: string
  pillar_id: string
  difficulty_level: 'easy' | 'medium' | 'hard'
  is_free: boolean
  cover_image_url: string
  sort_order: number
  badge_reward_id: string | null
  status: 'draft' | 'published' | 'archived'
  is_featured: boolean
  age_groups: string[]
  certificate_enabled: boolean
  certificate_title: string
}

export interface PathArticleItem {
  id: string
  article_id: string
  sort_order: number
  is_required?: boolean
  article: { id: string; title: string; slug: string; reading_time_minutes?: number } | null
}

export async function fetchAdminPaths(): Promise<AdminPathListItem[]> {
  const { data: paths, error } = await supabase
    .from('adventure_paths')
    .select('*, pillar:pillars(*)')
    .order('sort_order')
  if (error) throw error

  const { data: pathArticles } = await supabase.from('path_articles').select('adventure_path_id')
  const counts: Record<string, number> = {}
  ;(pathArticles ?? []).forEach((pa) => {
    counts[pa.adventure_path_id] = (counts[pa.adventure_path_id] ?? 0) + 1
  })

  return (paths ?? []).map((p) => ({
    ...p,
    pillar: (Array.isArray(p.pillar) ? p.pillar[0] : p.pillar) as Pillar | null,
    article_count: counts[p.id] ?? 0,
  }))
}

export async function fetchAdminPath(id: string): Promise<AdventurePath> {
  const { data, error } = await supabase.from('adventure_paths').select('*').eq('id', id).single()
  if (error) throw error
  return data as AdventurePath
}

export async function fetchPathArticles(pathId: string): Promise<PathArticleItem[]> {
  const { data, error } = await supabase
    .from('path_articles')
    .select('id, article_id, sort_order, is_required, article:articles(id, title, slug, reading_time_minutes)')
    .eq('adventure_path_id', pathId)
    .order('sort_order')
  if (error) throw error
  return (data ?? []).map((row) => ({
    ...row,
    article: (Array.isArray(row.article) ? row.article[0] : row.article) as PathArticleItem['article'],
  })) as PathArticleItem[]
}

export async function searchArticles(query: string) {
  const { data, error } = await supabase
    .from('articles')
    .select('id, title, slug')
    .ilike('title', `%${query}%`)
    .limit(20)
  if (error) throw error
  return data ?? []
}

export async function createAdminPath(form: AdminPathForm): Promise<string> {
  const { data, error } = await supabase.from('adventure_paths').insert({
    title: form.title,
    slug: form.slug,
    public_slug: form.public_slug || null,
    description: form.description || null,
    full_description: form.full_description || null,
    mission_statement: form.mission_statement || null,
    icon: form.icon || null,
    pillar_id: form.pillar_id,
    difficulty_level: form.difficulty_level,
    is_free: form.is_free,
    cover_image_url: form.cover_image_url || null,
    sort_order: form.sort_order,
    badge_reward_id: form.badge_reward_id || null,
    status: form.status,
    is_featured: form.is_featured,
    age_groups: form.age_groups,
    certificate_enabled: form.certificate_enabled,
    certificate_title: form.certificate_title || null,
  }).select('id').single()
  if (error) throw error
  await logAdminAction('path_created', 'path', data.id, { title: form.title })
  return data.id
}

export async function updateAdminPath(id: string, form: AdminPathForm): Promise<void> {
  const { error } = await supabase.from('adventure_paths').update({
    title: form.title,
    slug: form.slug,
    public_slug: form.public_slug || null,
    description: form.description || null,
    full_description: form.full_description || null,
    mission_statement: form.mission_statement || null,
    icon: form.icon || null,
    pillar_id: form.pillar_id,
    difficulty_level: form.difficulty_level,
    is_free: form.is_free,
    cover_image_url: form.cover_image_url || null,
    sort_order: form.sort_order,
    badge_reward_id: form.badge_reward_id || null,
    status: form.status,
    is_featured: form.is_featured,
    age_groups: form.age_groups,
    certificate_enabled: form.certificate_enabled,
    certificate_title: form.certificate_title || null,
  }).eq('id', id)
  if (error) throw error
  await logAdminAction('path_updated', 'path', id, { title: form.title })
}

export async function deleteAdminPath(id: string): Promise<void> {
  const { error } = await supabase.from('adventure_paths').delete().eq('id', id)
  if (error) throw error
  await logAdminAction('path_deleted', 'path', id)
}

export async function addArticleToPath(pathId: string, articleId: string): Promise<void> {
  const { data: existing } = await supabase
    .from('path_articles')
    .select('sort_order')
    .eq('adventure_path_id', pathId)
    .order('sort_order', { ascending: false })
    .limit(1)
  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1
  const { error } = await supabase.from('path_articles').insert({
    adventure_path_id: pathId,
    article_id: articleId,
    sort_order: nextOrder,
  })
  if (error) throw error
  await logAdminAction('path_article_added', 'path', pathId, { article_id: articleId })
}

export async function removeArticleFromPath(pathArticleId: string, pathId: string): Promise<void> {
  const { error } = await supabase.from('path_articles').delete().eq('id', pathArticleId)
  if (error) throw error
  await logAdminAction('path_article_removed', 'path', pathId)
}

export async function reorderPathArticles(items: { id: string; sort_order: number }[]): Promise<void> {
  await Promise.all(
    items.map(({ id, sort_order }) =>
      supabase.from('path_articles').update({ sort_order }).eq('id', id)
    )
  )
}

export async function fetchBadges() {
  const { data, error } = await supabase.from('badges').select('id, name').order('name')
  if (error) throw error
  return data ?? []
}

export async function togglePathStatus(id: string, status: 'draft' | 'published' | 'archived'): Promise<void> {
  const { error } = await supabase.from('adventure_paths').update({ status }).eq('id', id)
  if (error) throw error
  await logAdminAction('path_status_updated', 'path', id, { status })
}

export async function movePathOrder(id: string, direction: 'up' | 'down', paths: AdminPathListItem[]): Promise<void> {
  const index = paths.findIndex((p) => p.id === id)
  if (index < 0) return
  const swapIndex = direction === 'up' ? index - 1 : index + 1
  if (swapIndex < 0 || swapIndex >= paths.length) return

  const current = paths[index]
  const other = paths[swapIndex]
  await Promise.all([
    supabase.from('adventure_paths').update({ sort_order: other.sort_order }).eq('id', current.id),
    supabase.from('adventure_paths').update({ sort_order: current.sort_order }).eq('id', other.id),
  ])
}

export async function updatePathArticleRequired(pathArticleId: string, isRequired: boolean): Promise<void> {
  const { error } = await supabase.from('path_articles').update({ is_required: isRequired }).eq('id', pathArticleId)
  if (error) throw error
}
