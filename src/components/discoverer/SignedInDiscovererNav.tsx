import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useSelectedChild } from '@/context/SelectedChildContext'
import ParentGateLink from '@/components/parent/ParentGateLink'
import UserAvatar from '@/components/UserAvatar'
import { fetchChildStarsTotal } from '@/lib/adventure/engagement'
import { activeChildHomePath } from '@/lib/navigation'
import { supabase } from '@/lib/supabase'
import DiscovererSearchModal from '@/components/discoverer/DiscovererSearchModal'

const SIGNED_IN_LINKS = [
  { icon: '🏠', label: 'Home', to: '/discoverer' },
  { icon: '🔭', label: 'Explore', to: '/discoverer/explore' },
  { icon: '🗺️', label: 'My Journey', to: '/discoverer/journey' },
  { icon: '🎯', label: 'Daily Mission', to: '/discoverer/mission' },
  { icon: '📚', label: 'Library', to: '/discoverer/library' },
  { icon: '🏆', label: 'Badges', to: '/discoverer/badges' },
] as const

export default function SignedInDiscovererNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const { selectedChild } = useSelectedChild()
  const [menuOpen, setMenuOpen] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [stars, setStars] = useState<number | null>(null)
  const avatarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!selectedChild) {
      setStars(null)
      return
    }
    fetchChildStarsTotal(selectedChild.id).then(setStars).catch(() => setStars(null))
  }, [selectedChild?.id])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const signOut = async () => {
    setAvatarOpen(false)
    await supabase.auth.signOut()
    navigate('/login')
  }

  const isActive = (to: string) =>
    location.pathname === to || location.pathname.startsWith(`${to}/`)

  if (!selectedChild) return null

  const childHome = activeChildHomePath(selectedChild)

  return (
    <>
      <DiscovererSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <nav className="bg-white border-b border-gray-200 shadow-sm h-[72px] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-4 md:px-10">
          <Link
            to="/discoverer"
            className="hidden md:flex items-center shrink-0 mr-2"
            aria-label="Yaqza Kids home"
          >
            <span
              className="font-display font-bold text-[#1B2F5E] tracking-tight"
              style={{ fontSize: 18, letterSpacing: '0.06em' }}
            >
              YAQZA KIDS
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-0.5 flex-1 justify-center overflow-x-auto">
            {SIGNED_IN_LINKS.map((link) => {
              const active = isActive(link.to)
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex flex-col items-center px-3 py-1 rounded-xl transition-colors min-w-[68px] shrink-0 ${
                    active ? 'bg-[#EEF4FF] text-navy' : 'text-navy/70 hover:text-navy hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg leading-none">{link.icon}</span>
                  <span className="text-[10px] font-bold mt-1 whitespace-nowrap">{link.label}</span>
                </Link>
              )
            })}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="text-xl p-2 hover:bg-gray-50 rounded-full"
              aria-label="Search stories"
            >
              🔍
            </button>
            {stars !== null && (
              <Link
                to="/discoverer/rewards"
                className="px-3 py-1.5 rounded-full text-sm font-extrabold hover:opacity-90"
                style={{ background: '#FFF8ED', color: '#F5A623' }}
              >
                ⭐ {stars.toLocaleString()}
              </Link>
            )}
            <div className="relative" ref={avatarRef}>
              <button
                type="button"
                onClick={() => setAvatarOpen((o) => !o)}
                className="rounded-full ring-2 ring-teal/30"
                aria-label="Account menu"
                aria-expanded={avatarOpen}
              >
                <UserAvatar
                  name={selectedChild.name}
                  avatarId={selectedChild.avatar_id ?? null}
                  size={36}
                />
              </button>
              {avatarOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                  <p className="px-4 py-2 text-xs font-extrabold text-[#2AAFA0] uppercase tracking-wide border-b border-gray-100 mb-1">
                    {selectedChild.name}
                  </p>
                  {[
                    { label: 'Switch Child', to: '/children', action: null, gate: false },
                    { label: 'My Progress', to: childHome, action: null, gate: false },
                    { label: 'Home', to: childHome, action: null, gate: false },
                    { label: 'Parent Dashboard', to: '/parent/dashboard', action: null, gate: true },
                    { label: 'Sign Out', to: null, action: signOut, gate: false },
                  ].map((item) =>
                    item.to ? (
                      item.gate ? (
                        <ParentGateLink
                          key={item.label}
                          to={item.to}
                          onClick={() => setAvatarOpen(false)}
                          className="block px-4 py-2.5 text-sm font-semibold text-navy hover:bg-[#EEF4FF]"
                        >
                          {item.label}
                        </ParentGateLink>
                      ) : (
                        <Link
                          key={item.label}
                          to={item.to}
                          onClick={() => setAvatarOpen(false)}
                          className="block px-4 py-2.5 text-sm font-semibold text-navy hover:bg-[#EEF4FF]"
                        >
                          {item.label}
                        </Link>
                      )
                    ) : (
                      <button
                        key={item.label}
                        type="button"
                        onClick={item.action ?? undefined}
                        className="block w-full text-left px-4 py-2.5 text-sm font-semibold text-navy hover:bg-[#EEF4FF]"
                      >
                        {item.label}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
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
          <div className="md:hidden bg-white border-t px-4 py-4 space-y-2">
            <p className="text-xs font-extrabold text-teal uppercase px-1 pb-2">{selectedChild.name}</p>
            {SIGNED_IN_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 text-navy font-bold py-2"
              >
                <span className="text-xl">{link.icon}</span>
                {link.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false)
                setSearchOpen(true)
              }}
              className="flex items-center gap-3 text-navy font-bold py-2 w-full text-left"
            >
              <span className="text-xl">🔍</span>
              Search
            </button>
            {stars !== null && (
              <Link
                to="/discoverer/rewards"
                onClick={() => setMenuOpen(false)}
                className="block text-gold font-extrabold py-2"
              >
                ⭐ {stars.toLocaleString()} Stars
              </Link>
            )}
            <Link to="/children" onClick={() => setMenuOpen(false)} className="block text-navy font-bold py-2">
              Switch Child
            </Link>
            <Link to={childHome} onClick={() => setMenuOpen(false)} className="block text-navy font-bold py-2">
              My Progress
            </Link>
            <Link to={childHome} onClick={() => setMenuOpen(false)} className="block text-navy font-bold py-2">
              Home
            </Link>
            <ParentGateLink to="/parent/dashboard" onClick={() => setMenuOpen(false)} className="block text-navy font-bold py-2">
              Parent Dashboard
            </ParentGateLink>
            <button type="button" onClick={signOut} className="block text-navy font-bold py-2 w-full text-left">
              Sign Out
            </button>
          </div>
        )}
      </nav>
    </>
  )
}
