import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { authUrlForLocation } from '@/lib/navigation'

const MARKETING_LINKS = [
  { label: 'Discover', to: '/discoverer' },
  { label: 'Curiosity Starts Here', to: '/discoverer#curiosity-starts-here' },
  { label: 'Learning Paths', to: '/paths' },
  { label: 'For Parents', to: '/parents' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'About', to: '/about' },
] as const

function navLinkClass(active: boolean) {
  return `text-[13px] font-bold transition-colors ${
    active ? 'text-[#2AAFA0]' : 'text-[#1B2F5E]/75 hover:text-[#1B2F5E]'
  }`
}

export default function SignedOutDiscovererNav() {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const isActive = (to: string) =>
    location.pathname === to || (to !== '/discoverer' && location.pathname.startsWith(to))

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm h-[72px] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-4 md:px-10">
        <Link to="/" className="shrink-0" aria-label="Yaqza Kids home">
          <span
            className="font-display font-bold text-[#1B2F5E] tracking-tight"
            style={{ fontSize: 18, letterSpacing: '0.06em' }}
          >
            YAQZA KIDS
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-5 flex-1 justify-center">
          {MARKETING_LINKS.map((link) => (
            <Link key={link.to} to={link.to} className={navLinkClass(isActive(link.to))}>
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link
            to={authUrlForLocation('/login', location)}
            className="px-4 py-1.5 border-2 border-[#1B2F5E] text-[#1B2F5E] rounded-full text-sm font-bold hover:opacity-80"
          >
            Sign In
          </Link>
          <Link
            to={authUrlForLocation('/signup', location)}
            className="px-4 py-1.5 bg-[#2AAFA0] text-white rounded-full text-sm font-bold hover:opacity-90"
          >
            Start Free
          </Link>
        </div>

        <button
          type="button"
          className="md:hidden p-2 text-navy"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white border-t px-4 py-4 space-y-3">
          {MARKETING_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className="block text-navy font-bold py-2"
            >
              {link.label}
            </Link>
          ))}
          <Link
            to={authUrlForLocation('/login', location)}
            onClick={() => setMenuOpen(false)}
            className="block text-center py-2 border-2 border-navy text-navy rounded-full font-bold"
          >
            Sign In
          </Link>
          <Link
            to={authUrlForLocation('/signup', location)}
            onClick={() => setMenuOpen(false)}
            className="block text-center py-2 bg-[#2AAFA0] text-white rounded-full font-bold"
          >
            Start Free
          </Link>
        </div>
      )}
    </nav>
  )
}
