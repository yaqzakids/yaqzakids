import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import ParentGateLink from '@/components/parent/ParentGateLink'
import { useUnreadMessageCount } from '@/lib/messaging/useUnreadMessageCount'
import { supabase } from '@/lib/supabase'

export type ParentNavActive = 'children' | 'dashboard' | 'messages' | 'support' | 'account'

const NAV_ITEMS: {
  label: string
  to: string
  key: ParentNavActive
  gate: boolean
}[] = [
  { label: 'Children', to: '/children', key: 'children', gate: false },
  { label: 'Parent Dashboard', to: '/parent/dashboard', key: 'dashboard', gate: true },
  { label: 'Messages', to: '/messages', key: 'messages', gate: true },
  { label: 'Support', to: '/support', key: 'support', gate: true },
  { label: 'Account', to: '/parent/account', key: 'account', gate: true },
]

function linkClass(active: boolean) {
  return `text-sm font-bold no-underline transition-colors ${
    active ? 'text-navy' : 'text-[#1B2F5E]/70 hover:text-navy'
  }`
}

export default function ParentNavbar({ active }: { active?: ParentNavActive }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { count } = useUnreadMessageCount()
  const [menuOpen, setMenuOpen] = useState(false)

  const resolvedActive =
    active ??
    (location.pathname.startsWith('/children')
      ? 'children'
      : location.pathname.startsWith('/parent/account')
        ? 'account'
        : location.pathname.startsWith('/messages')
          ? 'messages'
          : location.pathname.startsWith('/support')
            ? 'support'
            : location.pathname.startsWith('/parent/dashboard')
              ? 'dashboard'
              : undefined)

  const signOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const renderLink = (item: (typeof NAV_ITEMS)[number], onClick?: () => void) => {
    const isActive = resolvedActive === item.key
    const className = linkClass(isActive)
    const content =
      item.key === 'messages' ? (
        <span className="inline-flex items-center gap-1.5">
          Messages
          {count > 0 && (
            <span className="bg-coral text-white text-[10px] font-extrabold min-w-[18px] h-[18px] px-1 rounded-full inline-flex items-center justify-center">
              {count > 99 ? '99+' : count}
            </span>
          )}
        </span>
      ) : (
        item.label
      )

    if (item.gate) {
      return (
        <ParentGateLink key={item.to} to={item.to} className={className} onClick={onClick}>
          {content}
        </ParentGateLink>
      )
    }

    return (
      <Link key={item.to} to={item.to} className={className} onClick={onClick}>
        {content}
      </Link>
    )
  }

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-10 h-[72px] flex items-center justify-between gap-4">
        <Link to="/" className="shrink-0 font-display font-bold text-[#1B2F5E] tracking-tight no-underline">
          YAQZA KIDS
        </Link>

        <div className="hidden lg:flex items-center gap-5 flex-1 justify-center">
          {NAV_ITEMS.map((item) => renderLink(item))}
        </div>

        <button
          type="button"
          onClick={() => void signOut()}
          className="hidden md:inline-flex px-4 py-1.5 border-2 border-[#1B2F5E] text-[#1B2F5E] rounded-full text-sm font-bold hover:opacity-80"
        >
          Sign Out
        </button>

        <button
          type="button"
          className="lg:hidden p-2 text-navy"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {menuOpen && (
        <div className="lg:hidden bg-white border-t px-4 py-4 space-y-3">
          {NAV_ITEMS.map((item) => renderLink(item, () => setMenuOpen(false)))}
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false)
              void signOut()
            }}
            className="block w-full text-center py-2 border-2 border-navy text-navy rounded-full font-bold"
          >
            Sign Out
          </button>
        </div>
      )}
    </nav>
  )
}
