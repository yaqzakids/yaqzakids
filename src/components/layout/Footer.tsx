import { Link } from 'react-router-dom'
import { PUBLIC_HOME_PATH } from '@/lib/navigation'
import { SITE_EMAILS } from '@/lib/constants'
import { useLanguage, type Language } from '@/i18n'
import ParentGateLink from '@/components/parent/ParentGateLink'
import BrandLogo from '@/components/BrandLogo'

interface FooterProps {
  variant?: 'light' | 'dark'
  logoHeight?: number
}

const LEARN_LINKS = [
  { label: 'Discoverer', to: '/discoverer' },
  { label: 'Explorer', to: '/explorer' },
  { label: 'Thinker', to: '/thinker' },
  { label: 'Learning Paths', to: '/paths' },
  { label: 'Public Stories', to: '/sample-stories' },
] as const

const PARENT_LINKS = [
  { label: 'For Parents', to: '/parents', gate: false },
  { label: 'Pricing', to: '/pricing', gate: true },
  { label: 'Parent Dashboard', to: '/parent/dashboard', gate: true },
  { label: 'Support', to: '/support', gate: true },
] as const

const LEGAL_LINKS = [
  { label: 'About', to: '/about', external: false },
  { label: 'Privacy Policy', to: '/about#privacy', external: false },
  { label: 'Terms of Use', to: '/about#terms', external: false },
  { label: 'Contact', to: `mailto:${SITE_EMAILS.contact}`, external: true },
] as const

function FooterLink({
  to,
  label,
  external,
  className,
}: {
  to: string
  label: string
  external?: boolean
  className: string
}) {
  if (external) {
    return (
      <a href={to} className={className}>
        {label}
      </a>
    )
  }
  return (
    <Link to={to} className={className}>
      {label}
    </Link>
  )
}

function FooterLanguageSwitcher({ isDark }: { isDark: boolean }) {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Language">
      {(['en', 'fr', 'ar'] as Language[]).map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => setLanguage(lang)}
          className={`px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
            language === lang
              ? isDark
                ? 'bg-gold text-navy'
                : 'bg-[#2AAFA0]/15 text-[#2AAFA0]'
              : isDark
                ? 'text-white/50 hover:text-white'
                : 'text-[#6B7280] hover:text-[#1B2F5E]'
          }`}
          aria-pressed={language === lang}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

export default function Footer({ variant = 'light', logoHeight = 40 }: FooterProps) {
  const isDark = variant === 'dark'
  const year = new Date().getFullYear()

  const linkClass = `text-sm transition-colors ${
    isDark ? 'text-white/65 hover:text-white' : 'text-[#6B7280] hover:text-[#2AAFA0]'
  }`

  const headingClass = `font-bold text-xs uppercase tracking-widest mb-3 ${
    isDark ? 'text-gold' : 'text-[#2AAFA0]'
  }`

  return (
    <footer
      className={`mt-auto rounded-t-3xl ${
        isDark ? 'bg-navy text-white/70' : 'bg-[#F7FAFF] border-t border-[#E2EBF8]'
      } px-5 md:px-10 pt-10 pb-6`}
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
        {/* Brand */}
        <div className="sm:col-span-2 lg:col-span-1">
          <BrandLogo to={PUBLIC_HOME_PATH} height={logoHeight} className="mb-3" />
          <p className={`text-sm font-bold mb-2 ${isDark ? 'text-gold' : 'text-[#1B2F5E]'}`}>
            Rooted in Faith. Awake to the World.
          </p>
          <p className={`text-sm leading-relaxed max-w-xs ${isDark ? 'text-white/60' : 'text-[#6B7280]'}`}>
            A safe learning platform helping Muslim children explore science, history, technology, and the
            world through curiosity and Islamic values.
          </p>
        </div>

        {/* Learn */}
        <div>
          <h4 className={headingClass}>Learn</h4>
          <ul className="space-y-2.5">
            {LEARN_LINKS.map((item) => (
              <li key={item.label}>
                <FooterLink to={item.to} label={item.label} className={linkClass} />
              </li>
            ))}
          </ul>
        </div>

        {/* Parents */}
        <div>
          <h4 className={headingClass}>Parents</h4>
          <ul className="space-y-2.5">
            {PARENT_LINKS.map((item) => (
              <li key={item.label}>
                {item.gate ? (
                  <ParentGateLink to={item.to} className={linkClass}>
                    {item.label}
                  </ParentGateLink>
                ) : (
                  <FooterLink to={item.to} label={item.label} className={linkClass} />
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 className={headingClass}>Legal</h4>
          <ul className="space-y-2.5">
            {LEGAL_LINKS.map((item) => (
              <li key={item.label}>
                <FooterLink
                  to={item.to}
                  label={item.label}
                  external={item.external}
                  className={linkClass}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div
        className={`max-w-7xl mx-auto mt-8 pt-5 border-t flex flex-col sm:flex-row justify-between items-center gap-4 ${
          isDark ? 'border-white/10' : 'border-[#E2EBF8]'
        }`}
      >
        <p className={`text-xs text-center sm:text-left ${isDark ? 'text-white/45' : 'text-[#9CA3AF]'}`}>
          © {year} YaqzaKids. All rights reserved.
        </p>
        <FooterLanguageSwitcher isDark={isDark} />
      </div>
    </footer>
  )
}
