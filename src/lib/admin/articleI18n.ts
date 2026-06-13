import type { CSSProperties } from 'react'
import type { AgeGroup, Language } from '@/lib/types'
import type { AdventureArticle } from '@/lib/adventure/types'
import type { ArticleLocaleBundle, ArticleLocalesI18n } from '@/types/articleLocales'

export type { ArticleLocaleBundle, ArticleLocalesI18n } from '@/types/articleLocales'

export const ARTICLE_LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'fr', label: 'FR', flag: '🇫🇷' },
  { code: 'ar', label: 'AR', flag: '🇸🇦' },
]

export const COMPLETION_FIELDS: (keyof ArticleLocaleBundle)[] = [
  'content_explorer',
  'content_discoverer',
  'content_thinker',
  'islamic_teaching',
  'activity',
]

const ageContentKey: Record<AgeGroup, keyof ArticleLocaleBundle> = {
  explorer: 'content_explorer',
  discoverer: 'content_discoverer',
  thinker: 'content_thinker',
}

export function emptyLocaleBundle(): ArticleLocaleBundle {
  return {
    title: '',
    content_explorer: '',
    content_discoverer: '',
    content_thinker: '',
    islamic_teaching: '',
    think_about_it: [''],
    activity: '',
  }
}

export function emptyLocalesI18n(): ArticleLocalesI18n {
  return { en: emptyLocaleBundle(), fr: emptyLocaleBundle(), ar: emptyLocaleBundle() }
}

export function bundleFromLegacy(article: AdventureArticle): ArticleLocaleBundle {
  return {
    title: article.title ?? '',
    content_explorer: article.content_explorer ?? '',
    content_discoverer: article.content_discoverer ?? '',
    content_thinker: article.content_thinker ?? '',
    islamic_teaching: article.islamic_teaching ?? '',
    think_about_it: article.think_about_it?.length ? article.think_about_it : [''],
    activity: article.activity ?? '',
  }
}

export function articleToLocalesI18n(article: AdventureArticle): ArticleLocalesI18n {
  const stored = article.locales_i18n
  const en = bundleFromLegacy(article)

  if (stored && typeof stored === 'object') {
    return {
      en: { ...en, ...(stored.en ?? {}) },
      fr: { ...emptyLocaleBundle(), ...(stored.fr ?? {}) },
      ar: { ...emptyLocaleBundle(), ...(stored.ar ?? {}) },
    }
  }

  return { en, fr: emptyLocaleBundle(), ar: emptyLocaleBundle() }
}

export function getLocaleBundle(locales: ArticleLocalesI18n, lang: Language): ArticleLocaleBundle {
  return locales[lang] ?? emptyLocaleBundle()
}

export function setLocaleBundle(
  locales: ArticleLocalesI18n,
  lang: Language,
  patch: Partial<ArticleLocaleBundle>
): ArticleLocalesI18n {
  return {
    ...locales,
    [lang]: { ...getLocaleBundle(locales, lang), ...patch },
  }
}

export function countLocaleCompletion(bundle: ArticleLocaleBundle): { filled: number; total: number } {
  const filled = COMPLETION_FIELDS.filter((key) => String(bundle[key] ?? '').trim().length > 0).length
  return { filled, total: COMPLETION_FIELDS.length }
}

export function ageHasLocaleContent(bundle: ArticleLocaleBundle, age: AgeGroup): boolean {
  return String(bundle[ageContentKey[age]] ?? '').trim().length > 0
}

export function getLocalizedArticleFields(
  article: AdventureArticle,
  language: Language,
  ageGroup: AgeGroup
): {
  title: string
  content: string
  islamic_teaching: string | null
  think_about_it: string[] | null
  activity: string | null
} {
  const all = articleToLocalesI18n(article)
  const bundle = getLocaleBundle(all, language)
  const enBundle = getLocaleBundle(all, 'en')
  const pick = (value: string, fallback: string) => (value.trim() ? value : fallback)

  const title = pick(bundle.title, enBundle.title || article.title)
  const contentKey = ageContentKey[ageGroup]
  const content = pick(String(bundle[contentKey] ?? ''), String(enBundle[contentKey] ?? ''))
  const islamic = pick(bundle.islamic_teaching, enBundle.islamic_teaching || article.islamic_teaching || '')
  const activity = pick(bundle.activity, enBundle.activity || article.activity || '')
  const think =
    bundle.think_about_it.filter(Boolean).length > 0
      ? bundle.think_about_it.filter(Boolean)
      : enBundle.think_about_it.filter(Boolean).length > 0
        ? enBundle.think_about_it.filter(Boolean)
        : (article.think_about_it ?? [])

  return {
    title,
    content,
    islamic_teaching: islamic || null,
    think_about_it: think.length ? think : null,
    activity: activity || null,
  }
}

export function getArticleContentForAge(
  article: AdventureArticle,
  ageGroup: AgeGroup,
  language: Language = 'en'
): string {
  return getLocalizedArticleFields(article, language, ageGroup).content
}

export function localesToLegacyColumns(locales: ArticleLocalesI18n) {
  const en = getLocaleBundle(locales, 'en')
  return {
    title: en.title,
    content_explorer: en.content_explorer || null,
    content_discoverer: en.content_discoverer || null,
    content_thinker: en.content_thinker || null,
    islamic_teaching: en.islamic_teaching || null,
    think_about_it: en.think_about_it.filter(Boolean),
    activity: en.activity || null,
  }
}

export const arabicTextareaStyle: CSSProperties = {
  direction: 'rtl',
  textAlign: 'right',
  fontFamily: "'Noto Naskh Arabic', 'Amiri', 'Traditional Arabic', serif",
  lineHeight: 1.9,
  fontSize: 15,
}
