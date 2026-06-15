import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelectedChild } from '@/context/SelectedChildContext'
import ParentGateLink from '@/components/parent/ParentGateLink'
import UserAvatar from '@/components/UserAvatar'
import NavbarEngagement from '@/components/adventure/NavbarEngagement'
import { activeChildHomePath } from '@/lib/navigation'
import { supabase } from '@/lib/supabase'

type ChildNavVariant = 'explorer' | 'thinker'

const variantStyles: Record<
  ChildNavVariant,
  {
    bg: string
    border: string
    text: string
    homeLabel: string
  }
> = {
  explorer: {
    bg: 'bg-white',
    border: 'border-b-2 border-gold',
    text: 'text-[#D4820A]',
    homeLabel: 'Home',
  },
  thinker: {
    bg: 'bg-navy',
    border: 'border-b border-[#243B6E]',
    text: 'text-white',
    homeLabel: 'Home',
  },
}

export default function ExplorerThinkerChildNav({ variant }: { variant: ChildNavVariant }) {
  const navigate = useNavigate()
  const { selectedChild } = useSelectedChild()
  const [menuOpen, setMenuOpen] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const avatarRef = useRef<HTMLDivElement>(null)
  const styles = variantStyles[variant]

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  if (!selectedChild) return null

  const childHome = activeChildHomePath(selectedChild)

  const signOut = async () => {
    setAvatarOpen(false)
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <nav className={`${styles.bg} ${styles.border} h-16 sticky top-0 z-50`}>
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-4 md:px-10">
        <Link
          to={childHome}
          className={`shrink-0 font-display font-bold text-base tracking-tight ${styles.text}`}
          aria-label="Yaqza Kids home"
        >
          YAQZA KIDS
        </Link>

        <div className="hidden md:flex items-center gap-4 flex-1 justify-center">
          <Link
            to={childHome}
            className={`text-sm font-bold hover:opacity-80 ${variant === 'thinker' ? 'text-white/80 hover:text-gold' : 'text-[#D4820A]'}`}
          >
            {styles.homeLabel}
          </Link>
          <Link
            to="/adventures"
            className={`text-sm font-bold hover:opacity-80 ${variant === 'thinker' ? 'text-white/80 hover:text-gold' : 'text-[#D4820A]'}`}
          >
            Explore
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <NavbarEngagement />
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
                  { label: 'Switch Child', to: '/children', gate: false, action: null },
                  { label: 'My Progress', to: childHome, gate: false, action: null },
                  { label: 'Parent Dashboard', to: '/parent/dashboard', gate: true, action: null },
                  { label: 'Sign Out', to: null, gate: false, action: signOut },
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
          className={`md:hidden p-2 ${variant === 'thinker' ? 'text-white' : 'text-navy'}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {menuOpen && (
        <div className={`md:hidden ${styles.bg} border-t px-4 py-4 space-y-2`}>
          <Link to={childHome} onClick={() => setMenuOpen(false)} className="block font-bold py-2 text-navy">
            Home
          </Link>
          <Link to="/adventures" onClick={() => setMenuOpen(false)} className="block font-bold py-2 text-navy">
            Explore
          </Link>
          <Link to="/children" onClick={() => setMenuOpen(false)} className="block font-bold py-2 text-navy">
            Switch Child
          </Link>
          <ParentGateLink to="/parent/dashboard" onClick={() => setMenuOpen(false)} className="block font-bold py-2 text-navy">
            Parent Dashboard
          </ParentGateLink>
          <button type="button" onClick={signOut} className="block font-bold py-2 text-navy w-full text-left">
            Sign Out
          </button>
        </div>
      )}
    </nav>
  )
}
