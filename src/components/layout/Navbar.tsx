import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { STORAGE_KEYS } from '../../lib/constants'
import { useAuth } from '@/components/ProtectedRoute'
import { useSelectedChild } from '@/context/SelectedChildContext'
import NavbarEngagement from '@/components/adventure/NavbarEngagement'
import { useLanguage, useT, type Language } from '@/i18n'
import { supabase } from '@/lib/supabase'
import UserAvatar from '@/components/UserAvatar'
import { fetchChildStarsTotal } from '@/lib/adventure/engagement'
import { useEffect } from 'react'

type NavbarVariant = 'explorer' | 'discoverer' | 'thinker'

interface NavbarProps {
  variant: NavbarVariant
}

const NAV_LINKS = [
  { labelKey: 'home' as const, to: '/' },
  { labelKey: 'adventures' as const, to: '/adventures' },
  { labelKey: 'pricing' as const, to: '/pricing' },
]

const DISCOVERER_NAV = [
  { icon: '🏠', label: 'Home', to: '/discoverer' },
  { icon: '🔭', label: 'Explore', to: '/discoverer/explore' },
  { icon: '🗺️', label: 'Paths', to: '/adventures' },
  { icon: '🎯', label: 'Daily', to: '/discoverer/mission' },
  { icon: '📚', label: 'Library', to: '/discoverer/library' },
] as const

const variantStyles: Record<NavbarVariant, {
  bg: string
  border: string
  linkColor: string
  loginBorder: string
  loginText: string
  ctaBg: string
  ctaText: string
  shadow?: string
}> = {
  explorer: {
    bg: 'bg-white',
    border: 'border-b-2 border-gold',
    linkColor: 'text-[#D4820A]',
    loginBorder: 'border-gold',
    loginText: 'text-[#D4820A]',
    ctaBg: 'bg-gold',
    ctaText: 'text-white',
  },
  discoverer: {
    bg: 'bg-white',
    border: 'border-b border-gray-200 shadow-sm',
    linkColor: 'text-navy',
    loginBorder: 'border-navy',
    loginText: 'text-navy',
    ctaBg: 'bg-gold',
    ctaText: 'text-white',
  },
  thinker: {
    bg: 'bg-navy',
    border: 'border-b border-[#243B6E]',
    linkColor: 'text-white/75 hover:text-gold',
    loginBorder: 'border-white',
    loginText: 'text-white',
    ctaBg: 'bg-gold',
    ctaText: 'text-navy',
  },
}

function adminLinkStyle(variant: NavbarVariant, mobile = false) {
  const isThinker = variant === 'thinker'
  return {
    color: isThinker ? '#ffffff' : '#1B2F5E',
    fontSize: '13px',
    fontWeight: 700,
    textDecoration: 'none',
    padding: '6px 14px',
    border: isThinker ? '1.5px solid #ffffff' : '1.5px solid #1B2F5E',
    borderRadius: '999px',
    marginRight: mobile ? 0 : '8px',
    ...(mobile ? { display: 'block', textAlign: 'center' as const } : {}),
  }
}

export default function Navbar({ variant }: NavbarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { selectedChild } = useSelectedChild()
  const t = useT()
  const { language, setLanguage } = useLanguage()
  const [menuOpen, setMenuOpen] = useState(false)
  const [stars, setStars] = useState(0)
  const styles = variantStyles[variant]

  useEffect(() => {
    if (variant !== 'discoverer' || !selectedChild) {
      setStars(0)
      return
    }
    fetchChildStarsTotal(selectedChild.id).then(setStars).catch(() => setStars(0))
  }, [variant, selectedChild?.id])

  const switchAge = () => {
    localStorage.removeItem(STORAGE_KEYS.ageGroup)
    navigate('/welcome')
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <nav className={`${styles.bg} ${styles.border} ${variant === 'discoverer' ? 'h-[72px]' : 'h-16'} sticky top-0 z-50`}>
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-4 md:px-10">
        {variant === 'discoverer' ? (
          <>
            <div className="hidden md:flex items-center gap-1 flex-1">
              {DISCOVERER_NAV.map((link) => {
                const active = location.pathname === link.to || (link.to !== '/discoverer' && location.pathname.startsWith(link.to))
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex flex-col items-center px-4 py-1 rounded-xl transition-colors min-w-[72px] ${
                      active ? 'bg-[#EEF4FF] text-navy' : 'text-navy/70 hover:text-navy hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-xl leading-none">{link.icon}</span>
                    <span className="text-[11px] font-bold mt-1">{link.label}</span>
                  </Link>
                )
              })}
            </div>
            <div className="hidden md:flex items-center gap-3">
              <span
                className="px-3 py-1.5 rounded-full text-sm font-extrabold"
                style={{ background: '#FFF8ED', color: '#F5A623' }}
              >
                ⭐ {stars.toLocaleString()}
              </span>
              <Link to="/discoverer/explore" className="text-xl p-2 hover:bg-gray-50 rounded-full" aria-label="Search">
                🔍
              </Link>
              <Link to="/discoverer/dashboard" className="rounded-full ring-2 ring-teal/30">
                <UserAvatar
                  name={selectedChild?.name ?? user?.email ?? 'You'}
                  avatarId={selectedChild?.avatar_id ?? null}
                  size={36}
                />
              </Link>
              <button onClick={switchAge} className="text-[#9CA3AF] text-xs hover:text-muted transition-colors ml-1">
                {t.nav.switchAge}
              </button>
            </div>
          </>
        ) : (
          <>
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <Link key={link.to} to={link.to} className={`${styles.linkColor} text-[13px] font-bold hover:opacity-80 transition-opacity`}>
              {t.nav[link.labelKey]}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2">
            {(['en', 'fr', 'ar'] as Language[]).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={`text-sm font-semibold transition-colors ${
                  language === lang
                    ? 'text-[#1B2F5E] font-bold underline underline-offset-4'
                    : 'text-gray-500 hover:text-[#1B2F5E]'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
          {user && selectedChild && <NavbarEngagement />}
          <Link to="/admin" style={adminLinkStyle(variant)}>
            {t.nav.admin}
          </Link>
          {user ? (
            <>
              <Link
                to="/dashboard"
                className={`px-4 py-1.5 border-2 ${styles.loginBorder} ${styles.loginText} rounded-full text-sm font-bold hover:opacity-80 transition-opacity`}
              >
                {t.nav.dashboard}
              </Link>
              <button
                type="button"
                onClick={signOut}
                className={`px-4 py-1.5 border-2 ${styles.loginBorder} ${styles.loginText} rounded-full text-sm font-bold hover:opacity-80 transition-opacity bg-transparent cursor-pointer`}
              >
                {t.nav.logout}
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={`px-4 py-1.5 border-2 ${styles.loginBorder} ${styles.loginText} rounded-full text-sm font-bold hover:opacity-80 transition-opacity`}
              >
                {t.nav.login}
              </Link>
              <Link
                to="/signup"
                className={`px-4 py-1.5 ${styles.ctaBg} ${styles.ctaText} rounded-full text-sm font-bold hover:opacity-90 transition-opacity`}
              >
                {t.nav.signup}
              </Link>
            </>
          )}
          <button onClick={switchAge} className="text-[#9CA3AF] text-xs hover:text-muted transition-colors ml-1">
            {t.nav.switchAge}
          </button>
        </div>
          </>
        )}

        <button
          className={`md:hidden p-2 ${variant === 'thinker' ? 'text-white' : 'text-navy'}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {menuOpen && (
        <div className={`md:hidden ${styles.bg} border-t px-4 py-4 space-y-3`}>
          {variant === 'discoverer' ? (
            <>
              {DISCOVERER_NAV.map((link) => (
                <Link key={link.to} to={link.to} className="flex items-center gap-3 text-navy font-bold py-2">
                  <span className="text-xl">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
              <Link to="/discoverer/dashboard" className="block text-navy font-bold py-2">Dashboard</Link>
              <span className="block text-gold font-extrabold py-2">⭐ {stars.toLocaleString()}</span>
            </>
          ) : (
            <>
          {NAV_LINKS.map((link) => (
            <Link key={link.to} to={link.to} className={`block ${styles.linkColor} text-sm font-bold py-1`}>{t.nav[link.labelKey]}</Link>
          ))}
          <div className="flex items-center gap-2 pt-2">
            {(['en', 'fr', 'ar'] as Language[]).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={`text-sm font-semibold transition-colors ${
                  language === lang
                    ? 'text-[#1B2F5E] font-bold underline underline-offset-4'
                    : 'text-gray-500 hover:text-[#1B2F5E]'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
          {user && selectedChild && (
            <div className="py-2">
              <NavbarEngagement />
            </div>
          )}
          <Link to="/admin" style={adminLinkStyle(variant, true)}>
            {t.nav.admin}
          </Link>
          {user ? (
            <>
              <Link to="/dashboard" className="block text-center py-2 border-2 border-gold text-[#D4820A] rounded-full font-bold">{t.nav.dashboard}</Link>
              <button type="button" onClick={signOut} className="block w-full text-center py-2 border-2 border-gold text-[#D4820A] rounded-full font-bold bg-transparent cursor-pointer">{t.nav.logout}</button>
            </>
          ) : (
            <>
              <Link to="/login" className="block text-center py-2 border-2 border-gold text-[#D4820A] rounded-full font-bold">{t.nav.login}</Link>
              <Link to="/signup" className="block text-center py-2 bg-gold text-white rounded-full font-bold">{t.nav.signup}</Link>
            </>
          )}
          <button onClick={switchAge} className="block w-full text-center text-[#9CA3AF] text-xs py-1">{t.nav.switchAge}</button>
            </>
          )}
        </div>
      )}
    </nav>
  )
}

export function ExplorerNavbar() { return <Navbar variant="explorer" /> }
export function DiscovererNavbar() { return <Navbar variant="discoverer" /> }
export function ThinkerNavbar() { return <Navbar variant="thinker" /> }
