import { createClient } from '@supabase/supabase-js'
import type { AgeGroup, Article, ChildProfile, Profile, Progress, Quiz, Subscription } from './types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder')

/*
 * Supabase Database Schema (run in SQL editor):
 *
 * CREATE TABLE profiles (
 *   id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 *   full_name text NOT NULL,
 *   role text NOT NULL DEFAULT 'parent' CHECK (role IN ('parent', 'admin')),
 *   language text NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'fr', 'ar')),
 *   created_at timestamptz DEFAULT now()
 * );
 *
 * CREATE TABLE child_profiles (
 *   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *   parent_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
 *   name text NOT NULL,
 *   age_group text NOT NULL CHECK (age_group IN ('explorer', 'discoverer', 'thinker')),
 *   avatar text,
 *   language text DEFAULT 'en',
 *   xp_points integer DEFAULT 0,
 *   level integer DEFAULT 1,
 *   streak_days integer DEFAULT 0,
 *   last_active_date date,
 *   total_articles_read integer DEFAULT 0,
 *   total_quizzes_completed integer DEFAULT 0,
 *   badges text[] DEFAULT '{}'
 * );
 *
 * CREATE TABLE articles ( ... see types.ts for full column list );
 * CREATE TABLE quizzes ( ... );
 * CREATE TABLE progress ( ... );
 * CREATE TABLE missions ( ... );
 * CREATE TABLE subscriptions ( ... );
 */

export async function getPublishedArticles(limit = 6): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .order('published_date', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}

export async function getArticleById(id: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function getRelatedArticles(category: string, excludeId: string, limit = 3): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .eq('category', category)
    .neq('id', excludeId)
    .limit(limit)

  if (error) throw error
  return data ?? []
}

export async function getQuizzesByArticleId(articleId: string): Promise<Quiz[]> {
  const { data, error } = await supabase
    .from('quizzes')
    .select('*')
    .eq('article_id', articleId)

  if (error) throw error
  return data ?? []
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) return null
  return data
}

export async function createProfile(profile: Omit<Profile, 'created_at'>): Promise<void> {
  const { error } = await supabase.from('profiles').insert(profile)
  if (error) throw error
}

export async function getChildProfiles(parentId: string): Promise<ChildProfile[]> {
  const { data, error } = await supabase
    .from('child_profiles')
    .select('*')
    .eq('parent_id', parentId)

  if (error) throw error
  return data ?? []
}

export async function createChildProfile(child: Omit<ChildProfile, 'id' | 'xp_points' | 'level' | 'streak_days' | 'last_active_date' | 'total_articles_read' | 'total_quizzes_completed' | 'badges'>): Promise<ChildProfile> {
  const { data, error } = await supabase
    .from('child_profiles')
    .insert(child)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getSubscription(userId: string): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  if (error) return null
  return data
}

export async function createFreeSubscription(userId: string): Promise<void> {
  const { error } = await supabase.from('subscriptions').insert({
    user_id: userId,
    plan: 'free',
    status: 'active',
    start_date: new Date().toISOString().split('T')[0],
  })
  if (error) throw error
}

export async function getRecentProgress(childIds: string[], limit = 5): Promise<Progress[]> {
  if (childIds.length === 0) return []

  const { data, error } = await supabase
    .from('progress')
    .select('*, article:articles(title_en), child:child_profiles(name)')
    .in('child_id', childIds)
    .order('completed_date', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}

export async function updateChildXP(childId: string, xpEarned: number): Promise<void> {
  const { data: child } = await supabase
    .from('child_profiles')
    .select('xp_points, level')
    .eq('id', childId)
    .single()

  if (!child) return

  const newXP = child.xp_points + xpEarned
  const newLevel = Math.floor(newXP / 100) + 1

  await supabase
    .from('child_profiles')
    .update({ xp_points: newXP, level: newLevel })
    .eq('id', childId)
}

export function getArticleField<T extends Record<string, unknown>>(
  article: T,
  field: string,
  ageGroup: AgeGroup
): string | string[] | null {
  const suffix = ageGroup === 'explorer' ? '6_8' : ageGroup === 'discoverer' ? '9_12' : '13_16'
  const key = `${field}_en_${suffix}`
  return (article[key] as string | string[] | null) ?? null
}

export function getXPReward(article: Article, ageGroup: AgeGroup): number {
  if (ageGroup === 'explorer') return article.xp_reward_explorer
  if (ageGroup === 'discoverer') return article.xp_reward_discoverer
  return article.xp_reward_thinker
}
