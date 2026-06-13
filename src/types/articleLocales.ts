import type { Language } from '@/lib/types'

export type ArticleLocaleBundle = {
  title: string
  content_explorer: string
  content_discoverer: string
  content_thinker: string
  islamic_teaching: string
  think_about_it: string[]
  activity: string
}

export type ArticleLocalesI18n = Partial<Record<Language, ArticleLocaleBundle>>
