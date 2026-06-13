import { useLanguage, useT } from '@/i18n'
import type { AppLanguage } from '@/i18n'

const LANG_OPTIONS: { code: AppLanguage; short: string }[] = [
  { code: 'en', short: 'EN' },
  { code: 'fr', short: 'FR' },
  { code: 'ar', short: 'AR' },
]

function langButtonClass(active: boolean, variant: 'nav' | 'onboarding' = 'nav') {
  if (variant === 'onboarding') {
    return active
      ? 'bg-navy text-white border-navy'
      : 'bg-white/90 text-navy border-navy/20 hover:border-navy/40'
  }
  return active
    ? 'bg-gold/20 text-[#D4820A]'
    : 'text-muted hover:text-navy'
}

export function LanguagePickerOnboarding() {
  const t = useT()
  const { language, setLanguage } = useLanguage()

  return (
    <div className="w-full max-w-md mx-auto mb-6 text-center">
      <p className="font-display text-lg font-bold text-navy">{t.language.pickTitle}</p>
      <p className="text-sm text-muted mt-1 mb-3">{t.language.pickSubtitle}</p>
      <div className="flex justify-center gap-2 flex-wrap">
        {LANG_OPTIONS.map(({ code, short }) => (
          <button
            key={code}
            type="button"
            onClick={() => setLanguage(code)}
            className={`px-4 py-2 rounded-full text-sm font-bold border-2 transition-colors ${langButtonClass(language === code, 'onboarding')}`}
            aria-pressed={language === code}
          >
            {short} · {t.language[code]}
          </button>
        ))}
      </div>
    </div>
  )
}

interface LanguageSwitcherNavProps {
  variant?: 'explorer' | 'discoverer' | 'thinker'
}

export function LanguageSwitcherNav({ variant = 'explorer' }: LanguageSwitcherNavProps) {
  const { language, setLanguage } = useLanguage()
  const isThinker = variant === 'thinker'
  const isDiscoverer = variant === 'discoverer'

  return (
    <div className="flex gap-1" role="group" aria-label="Language">
      {LANG_OPTIONS.map(({ code, short }) => (
        <button
          key={code}
          type="button"
          onClick={() => setLanguage(code)}
          className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-colors ${
            language === code
              ? isThinker
                ? 'bg-gold text-navy'
                : isDiscoverer
                  ? 'bg-[#2AAFA0]/15 text-[#2AAFA0]'
                  : 'bg-gold/20 text-[#D4820A]'
              : isThinker
                ? 'text-white/60 hover:text-white'
                : isDiscoverer
                  ? 'text-[#1B2F5E]/50 hover:text-[#1B2F5E]'
                  : 'text-muted hover:text-navy'
          }`}
          aria-pressed={language === code}
        >
          {short}
        </button>
      ))}
    </div>
  )
}

export function LanguageSwitcherMobile() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="flex gap-2 pt-2">
      {LANG_OPTIONS.map(({ code, short }) => (
        <button
          key={code}
          type="button"
          onClick={() => setLanguage(code)}
          className={`px-3 py-1 rounded-full text-xs font-bold ${
            language === code ? 'bg-gold text-white' : 'bg-gray-100 text-navy'
          }`}
          aria-pressed={language === code}
        >
          {short}
        </button>
      ))}
    </div>
  )
}
