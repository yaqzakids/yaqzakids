import type { AvatarConfig } from './avatar/avatarConfig'

export type AgeGroup = 'explorer' | 'discoverer' | 'thinker'
export type Language = 'en' | 'fr' | 'ar'
export type UserRole = 'parent' | 'admin'
export type ArticleStatus = 'draft' | 'published'
export type SubscriptionPlan = 'free' | 'family_monthly' | 'family_yearly' | 'homeschool' | 'school'
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired'

export type UsulTheme =
  | 'tawhid'
  | 'revelation'
  | 'purpose'
  | 'akhlaq'
  | 'akhirah'
  | 'stewardship'
  | 'justice'
  | 'knowledge'

export interface ArticleFunFact {
  emoji: string
  fact: string
}

export interface ArticleVocabEntry {
  word: string
  definition: string
}

export interface Certificate {
  id: string
  child_profile_id: string
  path_id: string | null
  child_name: string
  path_name: string
  completed_at: string
  certificate_url?: string | null
}

export interface ReflectionResponse {
  id: string
  child_profile_id: string
  article_id: string
  response: string
  created_at: string
}

export type { AvatarConfig }

export interface Profile {
  id: string
  full_name: string
  role: string
  language: string
  created_at: string
  avatar_url?: string | null
  avatar_id?: string | null
  avatar_config?: AvatarConfig | null
}

export interface ChildProfile {
  id: string
  parent_id: string
  name: string
  age_group: AgeGroup
  avatar: string | null
  avatar_url?: string | null
  avatar_id?: string | null
  avatar_config?: AvatarConfig | null
  language: Language
  xp_points: number
  points?: number
  level: number
  streak_days: number
  last_active_date: string | null
  total_articles_read: number
  total_quizzes_completed: number
  badges: string[]
}

export interface Article {
  id: string
  title_en: string
  title_fr: string | null
  title_ar: string | null
  summary_en_6_8: string | null
  summary_en_9_12: string | null
  summary_en_13_16: string | null
  whats_happening_en_6_8: string | null
  whats_happening_en_9_12: string | null
  whats_happening_en_13_16: string | null
  why_it_matters_en_6_8: string | null
  why_it_matters_en_9_12: string | null
  why_it_matters_en_13_16: string | null
  history_context_en_6_8: string | null
  history_context_en_9_12: string | null
  history_context_en_13_16: string | null
  islamic_teaching_en_6_8: string | null
  islamic_teaching_en_9_12: string | null
  islamic_teaching_en_13_16: string | null
  think_about_it_en_6_8: string[] | null
  think_about_it_en_9_12: string[] | null
  think_about_it_en_13_16: string[] | null
  activity_en_6_8: string | null
  activity_en_9_12: string | null
  activity_en_13_16: string | null
  category: string
  image_url: string | null
  source: string | null
  source_url: string | null
  source_url_2: string | null
  source_url_3: string | null
  reading_time_minutes: number
  xp_reward_explorer: number
  xp_reward_discoverer: number
  xp_reward_thinker: number
  status: ArticleStatus
  is_featured: boolean
  is_top_story: boolean
  published_date: string | null
}

export interface Quiz {
  id: string
  article_id: string
  question_en: string
  option_a_en: string
  option_b_en: string
  option_c_en: string
  option_d_en: string
  correct_answer: 'A' | 'B' | 'C' | 'D'
  xp_reward: number
}

export interface Progress {
  id: string
  child_id: string
  article_id: string
  completed: boolean
  quiz_score: number | null
  xp_earned: number
  completed_date: string | null
  article?: Article
  child?: ChildProfile
}

export interface Mission {
  id: string
  title_en: string
  article_id: string
  xp_reward: number
  date: string
  age_group: AgeGroup
}

export interface Subscription {
  id: string
  user_id: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  start_date: string
  end_date: string | null
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
}

export type AgeGroupSuffix = '6_8' | '9_12' | '13_16'

export const AGE_GROUP_SUFFIX: Record<AgeGroup, AgeGroupSuffix> = {
  explorer: '6_8',
  discoverer: '9_12',
  thinker: '13_16',
}
