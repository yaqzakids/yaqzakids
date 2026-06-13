import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from '@/lib/supabase'
import { STORAGE_KEYS } from '@/lib/constants'
import type { Language } from '@/lib/types'
import en, { type TranslationKeys } from './locales/en'
import fr from './locales/fr'
import ar from './locales/ar'

const LOCALES: Record<Language, TranslationKeys> = { en, fr, ar }

export type AppLanguage = Language

interface LanguageContextValue {
  language: AppLanguage
  setLanguage: (lang: AppLanguage) => void
  dir: 'ltr' | 'rtl'
  isRtl: boolean
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function readStoredLanguage(): AppLanguage {
  if (typeof window === 'undefined') return 'en'
  const stored = localStorage.getItem(STORAGE_KEYS.language)
  return stored === 'fr' || stored === 'ar' ? stored : 'en'
}

async function persistLanguageToProfile(language: AppLanguage): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('profiles').update({ language }).eq('id', user.id)
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(readStoredLanguage)

  const setLanguage = useCallback((lang: AppLanguage) => {
    setLanguageState(lang)
    localStorage.setItem(STORAGE_KEYS.language, lang)
    void persistLanguageToProfile(lang)
  }, [])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('language')
        .eq('id', session.user.id)
        .maybeSingle()
      const profileLang = profile?.language
      if (profileLang === 'en' || profileLang === 'fr' || profileLang === 'ar') {
        setLanguageState(profileLang)
        localStorage.setItem(STORAGE_KEYS.language, profileLang)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const dir: 'ltr' | 'rtl' = language === 'ar' ? 'rtl' : 'ltr'

  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = dir
  }, [language, dir])

  const value = useMemo(
    () => ({ language, setLanguage, dir, isRtl: dir === 'rtl' }),
    [language, setLanguage, dir]
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}

export function useT(): TranslationKeys {
  const { language } = useLanguage()
  return LOCALES[language]
}

export { en, fr, ar }
export type { TranslationKeys, Language }
