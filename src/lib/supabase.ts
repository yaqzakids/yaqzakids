import type { AgeGroup, Article, ChildProfile, Language, Profile, Progress, Quiz, Subscription } from './types'
import { formatSupabaseError } from './supabaseErrors'
import { supabase } from './supabaseClientCore'

export {
  getActiveSiteUrl,
  isSupabaseReady,
  SUPABASE_CONFIG_ERROR,
  supabase,
} from './supabaseClientCore'

type PostgrestErrorLike = { code?: string; message?: string }

/** PostgREST cache missing age/interests on child_profiles (migration not applied yet) */
function isMissingOptionalChildColumnError(error: PostgrestErrorLike): boolean {
  const message = error.message ?? ''
  return (
    error.code === 'PGRST204' &&
    /child_profiles/i.test(message) &&
    /\b(age|interests)\b/i.test(message)
  )
}

function withoutOptionalChildFields(payload: Record<string, unknown>): Record<string, unknown> {
  const { age: _age, interests: _interests, ...rest } = payload
  return rest
}

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

/** Legacy marketing articles table (renamed by adventure migration) */
const LEGACY_ARTICLES = 'articles_legacy'

export async function getPublishedArticles(limit = 6): Promise<Article[]> {
  const { data, error } = await supabase
    .from(LEGACY_ARTICLES)
    .select('*')
    .eq('status', 'published')
    .order('published_date', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}

export async function getArticleById(id: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from(LEGACY_ARTICLES)
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function getRelatedArticles(category: string, excludeId: string, limit = 3): Promise<Article[]> {
  const { data, error } = await supabase
    .from(LEGACY_ARTICLES)
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
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, language, created_at, avatar_url')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('getProfile error:', error)
      return null
    }

    console.log('getProfile result:', data)
    return data
  } catch (err) {
    console.error('getProfile exception:', err)
    return null
  }
}

export async function createProfile(profile: Omit<Profile, 'created_at'>): Promise<void> {
  const { error } = await supabase.from('profiles').insert(profile)
  if (error) throw error
}

export async function upsertParentProfile(
  userId: string,
  fullName: string,
  language: Language
): Promise<void> {
  const { error } = await supabase.from('profiles').upsert(
    {
      id: userId,
      full_name: fullName,
      role: 'parent',
      language,
    },
    { onConflict: 'id' }
  )
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

export async function createChildProfile(
  child: Omit<
    ChildProfile,
    'id' | 'xp_points' | 'level' | 'streak_days' | 'last_active_date' | 'total_articles_read' | 'total_quizzes_completed' | 'badges'
  > & { avatar_id?: string | null },
): Promise<ChildProfile> {
  const { avatar_id, ...rest } = child
  const payload: Record<string, unknown> = { ...rest }

  if (avatar_id !== undefined) {
    payload.avatar_id = avatar_id
    console.log('saving avatar id:', avatar_id)
  }

  const { data: { user } } = await supabase.auth.getUser()
  console.log('saving for parent/user:', user?.id)

  let { data, error } = await supabase
    .from('child_profiles')
    .insert(payload)
    .select()
    .single()

  if (error && isMissingOptionalChildColumnError(error)) {
    console.warn('child_profiles.age/interests not in DB yet — saving without those fields. Run apply_child_profile_fields.sql.')
    ;({ data, error } = await supabase
      .from('child_profiles')
      .insert(withoutOptionalChildFields(payload))
      .select()
      .single())
  }

  console.log('avatar save result:', data)
  console.log('avatar save error:', error)

  if (error) {
    throw new Error(formatSupabaseError(error))
  }
  return data
}

export async function updateChildProfile(
  childId: string,
  update: {
    name?: string
    age?: number | null
    age_group?: AgeGroup
    avatar_id?: string | null
    language?: Language
    interests?: string[]
  },
): Promise<ChildProfile> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated.')
  }

  const payload: Record<string, unknown> = {}

  if (update.name !== undefined) payload.name = update.name
  if (update.age !== undefined) payload.age = update.age
  if (update.age_group !== undefined) payload.age_group = update.age_group
  if (update.language !== undefined) payload.language = update.language
  if (update.interests !== undefined) payload.interests = update.interests

  if (update.avatar_id !== undefined) {
    payload.avatar_id = update.avatar_id
    console.log('saving avatar id:', update.avatar_id)
  }

  console.log('saving for child profile:', childId)
  console.log('saving for parent/user:', user.id)

  let { data, error } = await supabase
    .from('child_profiles')
    .update(payload)
    .eq('id', childId)
    .eq('parent_id', user.id)
    .select()
    .single()

  if (error && isMissingOptionalChildColumnError(error)) {
    console.warn('child_profiles.age/interests not in DB yet — saving without those fields. Run apply_child_profile_fields.sql.')
    ;({ data, error } = await supabase
      .from('child_profiles')
      .update(withoutOptionalChildFields(payload))
      .eq('id', childId)
      .eq('parent_id', user.id)
      .select()
      .single())
  }

  console.log('avatar save result:', data)
  console.log('avatar save error:', error)

  if (error) {
    throw new Error(formatSupabaseError(error))
  }
  if (!data) {
    throw new Error('No child profile row was updated. Check that this child belongs to your account.')
  }

  return data
}

export async function getSubscription(userId: string): Promise<Subscription | null> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle()

    if (error) {
      console.warn('Subscription fetch failed:', error.message)
      return null
    }

    return data
  } catch (err) {
    console.warn('Subscription fetch failed:', err)
    return null
  }
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
    .from('article_progress')
    .select('id, child_profile_id, article_id, completed_at, updated_at, article:articles(title), child:child_profiles(name)')
    .in('child_profile_id', childIds)
    .eq('read_completed', true)
    .eq('quiz_passed', true)
    .order('completed_at', { ascending: false, nullsFirst: false })
    .limit(limit)

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id,
    child_id: row.child_profile_id,
    article_id: row.article_id,
    completed: true,
    quiz_score: null,
    xp_earned: 0,
    completed_date: row.completed_at ?? row.updated_at ?? null,
    article: row.article as unknown as Progress['article'],
    child: row.child as unknown as Progress['child'],
  }))
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
