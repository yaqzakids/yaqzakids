import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { STORAGE_KEYS } from '@/lib/constants'
import { useAuth } from '@/components/ProtectedRoute'
import { useSelectedChild } from '@/context/SelectedChildContext'
import PublicNav, { PUBLIC_NAV_LINKS } from '@/components/layout/PublicNav'
import ExplorerThinkerChildNav from '@/components/layout/ExplorerThinkerChildNav'
import { authUrlForLocation, shouldUseChildNav } from '@/lib/navigation'
import { useT } from '@/i18n'
import { supabase } from '@/lib/supabase'
import DiscovererNav from '@/components/discoverer/DiscovererNavbar'

type NavbarVariant = 'explorer' | 'discoverer' | 'thinker'

interface NavbarProps {
  variant: NavbarVariant
  forcePublic?: boolean
}

const variantStyles: Record<
  'explorer' | 'thinker',
  {
    bg: string
    border: string
    linkColor: string
    loginBorder: string
    loginText: string
    ctaBg: string
    ctaText: string
  }
> = {
  explorer: {
    bg: 'bg-white',
    border: 'border-b-2 border-gold',
    linkColor: 'text-[#D4820A]',
    loginBorder: 'border-gold',
    loginText: 'text-[#D4820A]',
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

export default function Navbar({ variant, forcePublic = false }: NavbarProps) {
  if (variant === 'discoverer') {
    return <DiscovererNav forcePublic={forcePublic} />
  }

  return <ExplorerThinkerNavbar variant={variant} forcePublic={forcePublic} />
}

function ExplorerThinkerNavbar({
  variant,
  forcePublic,
}: {
  variant: 'explorer' | 'thinker'
  forcePublic?: boolean
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { selectedChild } = useSelectedChild()
  const t = useT()
  const [menuOpen, setMenuOpen] = useState(false)
  const styles = variantStyles[variant]

  if (forcePublic) {
    return <PublicNav />
  }

  if (user && selectedChild && shouldUseChildNav(location.pathname)) {
    return <ExplorerThinkerChildNav variant={variant} />
  }

  const homeTo = variant === 'explorer' ? '/explorer' : '/thinker'

  const signOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <nav className={`${styles.bg} ${styles.border} h-16 sticky top-0 z-50`}>
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-4 md:px-10">
        <Link to={homeTo} className="shrink-0 font-display font-bold text-base tracking-tight" aria-label="Yaqza Kids home">
          <span className={variant === 'thinker' ? 'text-white' : 'text-navy'}>YAQZA KIDS</span>
        </Link>

        <div className="hidden lg:flex items-center gap-5 flex-1 justify-center">
          {PUBLIC_NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`${styles.linkColor} text-[13px] font-bold hover:opacity-80 transition-opacity`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link
                to="/children"
                className={`px-4 py-1.5 border-2 ${styles.loginBorder} ${styles.loginText} rounded-full text-sm font-bold hover:opacity-80 transition-opacity`}
              >
                My Children
              </Link>
              <button
                type="button"
                onClick={() => void signOut()}
                className={`px-4 py-1.5 ${styles.ctaBg} ${styles.ctaText} rounded-full text-sm font-bold hover:opacity-90 transition-opacity`}
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                to={authUrlForLocation('/login', location)}
                className={`px-4 py-1.5 border-2 ${styles.loginBorder} ${styles.loginText} rounded-full text-sm font-bold hover:opacity-80 transition-opacity`}
              >
                Sign In
              </Link>
              <Link
                to={authUrlForLocation('/signup', location)}
                className={`px-4 py-1.5 ${styles.ctaBg} ${styles.ctaText} rounded-full text-sm font-bold hover:opacity-90 transition-opacity`}
              >
                Start Free
              </Link>
            </>
          )}
          <button
            onClick={() => {
              localStorage.removeItem(STORAGE_KEYS.ageGroup)
              navigate('/welcome')
            }}
            className="text-[#9CA3AF] text-xs hover:text-muted transition-colors ml-1"
          >
            {t.nav.switchAge}
          </button>
        </div>

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
          {PUBLIC_NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className={`block ${styles.linkColor} text-sm font-bold py-1`}
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link
                to="/children"
                onClick={() => setMenuOpen(false)}
                className="block text-center py-2 border-2 border-gold text-[#D4820A] rounded-full font-bold"
              >
                My Children
              </Link>
              <button
                type="button"
                onClick={() => void signOut()}
                className="block w-full text-center py-2 bg-gold text-white rounded-full font-bold"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                to={authUrlForLocation('/login', location)}
                onClick={() => setMenuOpen(false)}
                className="block text-center py-2 border-2 border-gold text-[#D4820A] rounded-full font-bold"
              >
                Sign In
              </Link>
              <Link
                to={authUrlForLocation('/signup', location)}
                onClick={() => setMenuOpen(false)}
                className="block text-center py-2 bg-gold text-white rounded-full font-bold"
              >
                Start Free
              </Link>
            </>
          )}
          <button
            onClick={() => {
              localStorage.removeItem(STORAGE_KEYS.ageGroup)
              navigate('/welcome')
            }}
            className="block w-full text-center text-[#9CA3AF] text-xs py-1"
          >
            {t.nav.switchAge}
          </button>
        </div>
      )}
    </nav>
  )
}

export { default as DiscovererNavbar } from '@/components/discoverer/DiscovererNavbar'
export function ExplorerNavbar() {
  return <Navbar variant="explorer" />
}
export function ThinkerNavbar() {
  return <Navbar variant="thinker" />
}
