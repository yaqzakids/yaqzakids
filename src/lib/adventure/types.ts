import type { AgeGroup } from '../types'
import type { ArticleLocalesI18n } from '@/types/articleLocales'
import type {
  ArticleFunFact,
  ArticleVocabEntry,
  UsulTheme,
} from '@/lib/types'

export interface Pillar {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  color: string
  sort_order: number
}

export interface Badge {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  image_url: string | null
}

export interface HeroCard {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  unlock_path_id: string | null
  sort_order: number
}

export interface AdventurePath {
  id: string
  pillar_id: string
  title: string
  slug: string
  description: string | null
  difficulty_level: 'easy' | 'medium' | 'hard'
  is_free: boolean
  badge_reward_id: string | null
  cover_image_url: string | null
  sort_order: number
  pillar?: Pillar
  badge?: Badge | null
}

export interface AdventureArticle {
  id: string
  pillar_id: string
  title: string
  slug: string
  excerpt: string | null
  content: string | null
  age_min: number
  age_max: number
  reading_time_minutes: number
  is_premium: boolean
  cover_image_url: string | null
  published: boolean
  content_explorer: string | null
  content_discoverer: string | null
  content_thinker: string | null
  islamic_teaching: string | null
  think_about_it: string[] | null
  activity: string | null
  source_name: string | null
  source_url: string | null
  locales_i18n?: ArticleLocalesI18n | null
  usul_theme?: UsulTheme | null
  quran_connection?: string | null
  quran_reference?: string | null
  hadith_connection?: string | null
  hadith_reference?: string | null
  islamic_reflection?: string | null
  take_action?: string | null
  reflection_question?: string | null
  fun_facts?: ArticleFunFact[] | null
  vocabulary?: ArticleVocabEntry[] | null
  quran_connection_i18n?: Record<string, string> | null
  islamic_reflection_i18n?: Record<string, string> | null
  think_about_it_i18n?: Record<string, string[]> | null
  take_action_i18n?: Record<string, string> | null
}

export interface PathArticle {
  id: string
  adventure_path_id: string
  article_id: string
  sort_order: number
  article?: AdventureArticle
}

export interface QuizOption {
  text: string
  is_correct: boolean
}

export interface QuizQuestion {
  id: string
  quiz_id: string
  question_text: string
  options: QuizOption[]
  explanation: string
  sort_order: number
}

export interface AdventureQuiz {
  id: string
  article_id: string
  title: string
  passing_score: number
}

export interface ArticleProgress {
  id: string
  child_profile_id: string
  article_id: string
  read_completed: boolean
  quiz_passed: boolean
  completed_at: string | null
}

export interface PathProgress {
  id: string
  child_profile_id: string
  adventure_path_id: string
  total_articles: number
  completed_articles: number
  completion_percentage: number
  completed: boolean
  completed_at: string | null
}

export interface QuizAttempt {
  id: string
  child_profile_id: string
  quiz_id: string
  score_percentage: number
  passed: boolean
  attempt_number: number
}

export interface ChildBadge {
  id: string
  child_profile_id: string
  badge_id: string
  awarded_at: string
  badge?: Badge
}

export interface ChildHeroCard {
  id: string
  child_profile_id: string
  hero_card_id: string
  unlocked_at: string
  hero_card?: HeroCard
}

export interface ChildStreak {
  id: string
  child_profile_id: string
  current_streak: number
  longest_streak: number
  last_activity_date: string | null
  created_at: string
}

export interface ChildDashboardAnalytics {
  childId: string
  totalStars: number
  currentStreak: number
  longestStreak: number
  articlesCompleted: number
  quizzesPassed: number
  badgesEarned: number
  lastActive: string | null
  mostActivePillar: string | null
  hasActivity: boolean
}

export type ArticleUnlockStatus = 'completed' | 'available' | 'locked'
export type ArticleLockReason = 'premium' | 'sequential'

export interface PathWithProgress extends AdventurePath {
  path_progress?: PathProgress | null
  accessible: boolean
  lessonCount?: number
  nextArticleTitle?: string | null
}

export interface PathArticleWithProgress extends PathArticle {
  progress?: ArticleProgress | null
  locked: boolean
  complete: boolean
  unlockStatus?: ArticleUnlockStatus
  lockReason?: ArticleLockReason | null
  previousArticle?: PathArticle | null
}

export function getArticleContentForAge(article: AdventureArticle, ageGroup: AgeGroup): string {
  if (ageGroup === 'explorer') return article.content_explorer ?? article.excerpt ?? ''
  if (ageGroup === 'discoverer') return article.content_discoverer ?? article.excerpt ?? ''
  return article.content_thinker ?? article.excerpt ?? ''
}
