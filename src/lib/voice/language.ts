import type { Language } from '@/lib/types'
import type { ReadAloudLanguage } from '@/lib/voice/types'

export function toReadAloudLanguage(value: string | null | undefined): ReadAloudLanguage {
  if (value === 'fr' || value === 'ar') return value
  return 'en'
}

export function resolveReadAloudLanguage(options: {
  childLanguage?: Language | string | null
  profileLanguage?: string | null
  storedLanguage?: string | null
}): ReadAloudLanguage {
  if (options.childLanguage) return toReadAloudLanguage(options.childLanguage)
  if (options.storedLanguage) return toReadAloudLanguage(options.storedLanguage)
  if (options.profileLanguage) return toReadAloudLanguage(options.profileLanguage)
  return 'en'
}

export function isArabicCapableVoice(voiceId: string): boolean {
  return voiceId.toLowerCase().startsWith('ar-')
}

export function voiceMatchesLanguage(voiceId: string, language: ReadAloudLanguage): boolean {
  const prefix = language === 'en' ? 'en-' : language === 'fr' ? 'fr-' : 'ar-'
  return voiceId.toLowerCase().startsWith(prefix)
}
