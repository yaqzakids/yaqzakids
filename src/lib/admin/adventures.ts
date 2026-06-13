import { supabase } from '@/lib/supabase'
import { logAdminAction } from './activity'
import type { AdminBadge, AdminHeroCard } from './types'
import type { Pillar } from '@/lib/adventure/types'
import { slugify } from './utils'

export async function fetchAdminPillars(): Promise<Pillar[]> {
  const { data, error } = await supabase.from('pillars').select('*').order('sort_order')
  if (error) throw error
  return data ?? []
}

export async function updatePillar(id: string, updates: Partial<Pillar>): Promise<void> {
  const { error } = await supabase.from('pillars').update(updates).eq('id', id)
  if (error) throw error
  await logAdminAction('pillar_updated', 'pillar', id, updates as Record<string, unknown>)
}

export async function fetchAdminBadges(): Promise<AdminBadge[]> {
  const { data, error } = await supabase.from('badges').select('*').order('name')
  if (error) throw error
  return (data ?? []) as AdminBadge[]
}

export async function saveBadge(badge: Partial<AdminBadge> & { name: string; slug: string }): Promise<AdminBadge> {
  if (badge.id) {
    const { data, error } = await supabase.from('badges').update(badge).eq('id', badge.id).select().single()
    if (error) throw error
    await logAdminAction('badge_updated', 'badge', badge.id)
    return data as AdminBadge
  }
  const { data, error } = await supabase.from('badges').insert({ ...badge, slug: badge.slug || slugify(badge.name) }).select().single()
  if (error) throw error
  await logAdminAction('badge_created', 'badge', data.id)
  return data as AdminBadge
}

export async function deleteBadge(id: string): Promise<void> {
  const { error } = await supabase.from('badges').delete().eq('id', id)
  if (error) throw error
  await logAdminAction('badge_deleted', 'badge', id)
}

export async function fetchAdminHeroCards(): Promise<AdminHeroCard[]> {
  const { data, error } = await supabase.from('hero_cards').select('*').order('sort_order')
  if (error) throw error
  return (data ?? []) as AdminHeroCard[]
}

export async function saveHeroCard(card: Partial<AdminHeroCard> & { name: string; slug: string }): Promise<AdminHeroCard> {
  if (card.id) {
    const { data, error } = await supabase.from('hero_cards').update(card).eq('id', card.id).select().single()
    if (error) throw error
    await logAdminAction('hero_card_updated', 'hero_card', card.id)
    return data as AdminHeroCard
  }
  const { data, error } = await supabase.from('hero_cards').insert({ ...card, slug: card.slug || slugify(card.name) }).select().single()
  if (error) throw error
  await logAdminAction('hero_card_created', 'hero_card', data.id)
  return data as AdminHeroCard
}

export async function deleteHeroCard(id: string): Promise<void> {
  const { error } = await supabase.from('hero_cards').delete().eq('id', id)
  if (error) throw error
  await logAdminAction('hero_card_deleted', 'hero_card', id)
}

export async function fetchPathOptions(): Promise<{ id: string; title: string }[]> {
  const { data, error } = await supabase.from('adventure_paths').select('id, title').order('title')
  if (error) throw error
  return data ?? []
}
