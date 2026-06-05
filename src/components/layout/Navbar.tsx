import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { IMAGES, STORAGE_KEYS } from '../../lib/constants'
type NavbarVariant = 'explorer' | 'discoverer' | 'thinker'

interface NavbarProps {
  variant: NavbarVariant
}

const NAV_LINKS = ['Home', 'Explore', 'Topics', 'Quizzes', 'About Us']

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

export default function Navbar({ variant }: NavbarProps) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [lang, setLang] = useState('EN')
  const styles = variantStyles[variant]

  const switchAge = () => {
    localStorage.removeItem(STORAGE_KEYS.ageGroup)
    navigate('/welcome')
  }

  return (
    <nav className={`${styles.bg} ${styles.border} h-16 sticky top-0 z-50`}>
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-4 md:px-10">
        <Link to={`/${variant}`}>
          <img src={IMAGES.logo} alt="Yaqza Kids" className="h-[52px]" />
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <a key={link} href="#" className={`${styles.linkColor} text-[13px] font-bold hover:opacity-80 transition-opacity`}>
              {link}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <div className="flex gap-1">
            {['EN', 'FR', 'AR'].map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-colors ${
                  lang === l
                    ? variant === 'thinker' ? 'bg-gold text-navy' : 'bg-gold/20 text-[#D4820A]'
                    : variant === 'thinker' ? 'text-white/60 hover:text-white' : 'text-muted hover:text-navy'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <Link
            to="/login"
            className={`px-4 py-1.5 border-2 ${styles.loginBorder} ${styles.loginText} rounded-full text-sm font-bold hover:opacity-80 transition-opacity`}
          >
            Login
          </Link>
          <Link
            to="/signup"
            className={`px-4 py-1.5 ${styles.ctaBg} ${styles.ctaText} rounded-full text-sm font-bold hover:opacity-90 transition-opacity`}
          >
            {variant === 'discoverer' ? 'Get Started' : 'Start Free'}
          </Link>
          <button onClick={switchAge} className="text-[#9CA3AF] text-xs hover:text-muted transition-colors ml-1">
            Switch Age
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
          {NAV_LINKS.map((link) => (
            <a key={link} href="#" className={`block ${styles.linkColor} text-sm font-bold py-1`}>{link}</a>
          ))}
          <div className="flex gap-2 pt-2">
            {['EN', 'FR', 'AR'].map((l) => (
              <button key={l} onClick={() => setLang(l)} className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100">{l}</button>
            ))}
          </div>
          <Link to="/login" className="block text-center py-2 border-2 border-gold text-[#D4820A] rounded-full font-bold">Login</Link>
          <Link to="/signup" className="block text-center py-2 bg-gold text-white rounded-full font-bold">Start Free</Link>
          <button onClick={switchAge} className="block w-full text-center text-[#9CA3AF] text-xs py-1">Switch Age</button>
        </div>
      )}
    </nav>
  )
}

export function ExplorerNavbar() { return <Navbar variant="explorer" /> }
export function DiscovererNavbar() { return <Navbar variant="discoverer" /> }
export function ThinkerNavbar() { return <Navbar variant="thinker" /> }
