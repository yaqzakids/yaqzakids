import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/components/ProtectedRoute'
import { useSelectedChild } from '@/context/SelectedChildContext'
import { useParentGate } from '@/context/ParentGateContext'
import UserAvatar from '@/components/UserAvatar'
import NavbarSearchModal from '@/components/layout/NavbarSearchModal'
import { useSignOut } from '@/hooks/useSignOut'
import { isParentUnlocked } from '@/lib/parentGate'
import {
  PUBLIC_NAV_LINKS,
  LEARNING_PATH_LINKS,
  DISCOVER_LINKS,
  PROGRESS_LINKS,
  childNavPaths,
  ageGroupBadgeClass,
  ageGroupLabel,
} from '@/lib/navLinks'
import { STORAGE_KEYS } from '@/lib/adventure/constants'
import type { ChildProfile } from '@/lib/types'

function useClickOutside(refs: React.RefObject<HTMLElement | null>[], onClose: () => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    const onMouseDown = (e: MouseEvent) => {
      const inside = refs.some((r) => r.current?.contains(e.target as Node))
      if (!inside) onClose()
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [refs, onClose, enabled])
}

function NavLink({
  to,
  children,
  active,
  onClick,
}: {
  to: string
  children: ReactNode
  active?: boolean
  onClick?: () => void
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`text-sm font-semibold transition-colors ${
        active ? 'text-[#F5A623]' : 'text-[#1B2F5E] hover:text-[#F5A623]'
      }`}
    >
      {children}
    </Link>
  )
}

function DropdownSectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="px-4 pt-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-[#9CA3AF]">
      {children}
    </p>
  )
}

function DropdownItem({
  to,
  children,
  onClick,
}: {
  to: string
  children: ReactNode
  onClick?: () => void
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="block px-4 py-2.5 text-sm font-semibold text-[#1B2F5E] hover:bg-[#F8FAFC]"
    >
      {children}
    </Link>
  )
}

function resolveActiveChild(selectedChild: ChildProfile | null, children: ChildProfile[]): ChildProfile | null {
  if (selectedChild) return selectedChild
  const storedId = localStorage.getItem(STORAGE_KEYS.selectedChildId)
  if (!storedId) return null
  return children.find((c) => c.id === storedId) ?? null
}

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { selectedChild, children, activeChildProfileId } = useSelectedChild()
  const { openParentGate } = useParentGate()
  const { signOut, signingOut } = useSignOut()

  const [exploreOpen, setExploreOpen] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const exploreRef = useRef<HTMLDivElement>(null)
  const avatarRef = useRef<HTMLDivElement>(null)

  const activeChild = resolveActiveChild(selectedChild, children)
  const hasActiveChild = Boolean(user && activeChildProfileId && activeChild)
  const paths = activeChild ? childNavPaths(activeChild) : null

  const closeAll = () => {
    setExploreOpen(false)
    setAvatarOpen(false)
    setMobileOpen(false)
  }

  useClickOutside([exploreRef], () => setExploreOpen(false), exploreOpen)
  useClickOutside([avatarRef], () => setAvatarOpen(false), avatarOpen)

  useEffect(() => {
    closeAll()
  }, [location.pathname])

  const isActive = (to: string) =>
    location.pathname === to || (to !== '/' && location.pathname.startsWith(`${to}/`))

  const openParent = (path: string) => {
    closeAll()
    if (isParentUnlocked()) {
      navigate(path)
      return
    }
    openParentGate(path)
  }

  const logo = (
    <Link to={hasActiveChild && paths ? paths.home : '/'} className="shrink-0 flex items-center" aria-label="Yaqza Kids home">
      <span
        className="font-display font-bold text-[#1B2F5E] tracking-tight leading-none"
        style={{ fontSize: '1.125rem', letterSpacing: '0.06em', height: 48, display: 'flex', alignItems: 'center' }}
      >
        YAQZA KIDS
      </span>
    </Link>
  )

  const signedOutCenter = (
    <div className="hidden md:flex items-center gap-6 flex-1 justify-center">
      {PUBLIC_NAV_LINKS.map((link) => (
        <NavLink key={link.to} to={link.to} active={isActive(link.to)}>
          {link.label}
        </NavLink>
      ))}
    </div>
  )

  const signedOutRight = (
    <div className="hidden md:flex items-center gap-3">
      <Link
        to="/login"
        className="px-4 py-2 border-2 border-[#1B2F5E] text-[#1B2F5E] rounded-full text-sm font-semibold hover:opacity-80"
      >
        Sign In
      </Link>
      <Link
        to="/signup"
        className="px-4 py-2 bg-[#F5A623] text-white rounded-full text-sm font-semibold hover:opacity-90"
      >
        Start Free
      </Link>
    </div>
  )

  const signedInNoChildRight = (
    <div className="hidden md:flex items-center gap-3">
      <Link
        to="/children"
        className="px-4 py-2 bg-[#2AAFA0] text-white rounded-full text-sm font-semibold hover:opacity-90"
      >
        Select Child
      </Link>
      <button
        type="button"
        onClick={() => void signOut()}
        disabled={signingOut}
        className="px-4 py-2 border-2 border-[#1B2F5E] text-[#1B2F5E] rounded-full text-sm font-semibold hover:opacity-80 disabled:opacity-50"
      >
        {signingOut ? 'Signing out…' : 'Sign Out'}
      </button>
    </div>
  )

  const signedInChildCenter = paths && (
    <div className="hidden md:flex items-center gap-5 flex-1 justify-center">
      <NavLink to={paths.home} active={isActive(paths.home)}>
        Home
      </NavLink>

      <div className="relative" ref={exploreRef}>
        <button
          type="button"
          onClick={() => setExploreOpen((o) => !o)}
          className={`flex items-center gap-1 text-sm font-semibold ${
            exploreOpen ? 'text-[#F5A623]' : 'text-[#1B2F5E] hover:text-[#F5A623]'
          }`}
          aria-expanded={exploreOpen}
        >
          Explore <span aria-hidden>▼</span>
        </button>
        {exploreOpen && (
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 min-w-[260px] bg-white rounded-xl shadow-lg border border-[#E5E7EB] py-2 z-50">
            <DropdownSectionLabel>Learning Paths</DropdownSectionLabel>
            {LEARNING_PATH_LINKS.map((item) => (
              <DropdownItem key={item.to} to={item.to} onClick={closeAll}>
                {item.label}
              </DropdownItem>
            ))}
            <div className="my-2 border-t border-[#E5E7EB]" />
            <DropdownSectionLabel>Discover</DropdownSectionLabel>
            {DISCOVER_LINKS.map((item) => (
              <DropdownItem key={item.to} to={item.to} onClick={closeAll}>
                {item.label}
              </DropdownItem>
            ))}
            <div className="my-2 border-t border-[#E5E7EB]" />
            <DropdownSectionLabel>My Progress</DropdownSectionLabel>
            {PROGRESS_LINKS.map((item) => {
              const to =
                item.to === '/achievements'
                  ? paths.achievements
                  : item.to === '/certificates'
                    ? paths.certificates
                    : paths.journey
              return (
                <DropdownItem key={item.label} to={to} onClick={closeAll}>
                  {item.label}
                </DropdownItem>
              )
            })}
          </div>
        )}
      </div>

      <NavLink to={paths.journey} active={isActive(paths.journey)}>
        My Journey
      </NavLink>

      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="p-2 rounded-lg hover:bg-[#F8FAFC] text-lg"
        aria-label="Search"
      >
        🔍
      </button>
    </div>
  )

  const signedInChildRight = activeChild && paths && (
    <div className="hidden md:flex items-center relative" ref={avatarRef}>
      <button
        type="button"
        onClick={() => setAvatarOpen((o) => !o)}
        className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-[#F8FAFC]"
        aria-expanded={avatarOpen}
        aria-label="Child menu"
      >
        <UserAvatar name={activeChild.name} avatarId={activeChild.avatar_id ?? null} size={36} />
        <span className="text-sm font-semibold text-[#1B2F5E] max-w-[120px] truncate">{activeChild.name}</span>
        <span className="text-[#6B7280] text-xs" aria-hidden>
          ▼
        </span>
      </button>
      {avatarOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border border-[#E5E7EB] py-2 z-50">
          <div className="px-4 py-3 border-b border-[#E5E7EB]">
            <p className="font-bold text-[#1B2F5E]">{activeChild.name}</p>
            <span
              className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${ageGroupBadgeClass(activeChild.age_group)}`}
            >
              {ageGroupLabel(activeChild.age_group)}
            </span>
          </div>
          <DropdownItem to={paths.profile} onClick={closeAll}>
            My Profile
          </DropdownItem>
          <DropdownItem to={paths.profileAvatar} onClick={closeAll}>
            Choose Avatar
          </DropdownItem>
          <DropdownItem to="/children" onClick={closeAll}>
            Switch Child
          </DropdownItem>
          <DropdownItem to={paths.achievements} onClick={closeAll}>
            Achievements
          </DropdownItem>
          <DropdownItem to={paths.certificates} onClick={closeAll}>
            Certificates
          </DropdownItem>
          <div className="my-2 border-t border-[#E5E7EB]" />
          <p className="px-4 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#9CA3AF] flex items-center gap-1">
            Parent Area <span aria-hidden>🔒</span>
          </p>
          {[
            { label: 'Parent Dashboard', to: '/parent/dashboard' },
            { label: 'Child Progress', to: '/parent/progress' },
            { label: 'Messages & Announcements', to: '/parent/messages' },
            { label: 'Subscription', to: '/parent/subscription' },
            { label: 'Settings', to: '/parent/settings' },
          ].map((item) => (
            <button
              key={item.to}
              type="button"
              onClick={() => openParent(item.to)}
              className="block w-full text-left px-4 py-2.5 text-sm font-semibold text-[#1B2F5E] hover:bg-[#F8FAFC]"
            >
              {item.label}
            </button>
          ))}
          <DropdownItem to="/parent/support" onClick={closeAll}>
            Support
          </DropdownItem>
          <div className="my-2 border-t border-[#E5E7EB]" />
          <button
            type="button"
            onClick={() => {
              closeAll()
              void signOut()
            }}
            disabled={signingOut}
            className="block w-full text-left px-4 py-2.5 text-sm font-semibold text-[#E85D4A] hover:bg-[#F8FAFC] disabled:opacity-50"
          >
            {signingOut ? 'Signing out…' : 'Sign Out'}
          </button>
        </div>
      )}
    </div>
  )

  const mobileToggle = (
    <button
      type="button"
      className="md:hidden p-2 text-[#1B2F5E]"
      onClick={() => setMobileOpen(true)}
      aria-label="Open menu"
    >
      ☰
    </button>
  )

  let center: ReactNode = signedOutCenter
  let right: ReactNode = signedOutRight

  if (authLoading) {
    center = <div className="hidden md:block flex-1" />
    right = <div className="hidden md:block w-32 h-9 bg-gray-100 animate-pulse rounded-full" />
  } else if (user && hasActiveChild) {
    center = signedInChildCenter
    right = signedInChildRight
  } else if (user) {
    center = signedOutCenter
    right = signedInNoChildRight
  }

  return (
    <>
      <NavbarSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <header className="sticky top-0 z-50 bg-white border-b border-[#E5E7EB] h-14 md:h-16">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-4 md:px-8 gap-4">
          {logo}
          {center}
          <div className="flex items-center gap-2">
            {right}
            {mobileToggle}
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-[120] md:hidden">
          <div className="absolute inset-0 bg-[#1B2F5E]/40" onClick={closeAll} aria-hidden />
          <div className="absolute right-0 top-0 bottom-0 w-[min(100%,320px)] bg-white shadow-xl flex flex-col animate-slide-in-right">
            <div className="flex items-center justify-between px-4 h-14 border-b border-[#E5E7EB]">
              <span className="font-display font-bold text-[#1B2F5E]">Menu</span>
              <button type="button" onClick={closeAll} className="p-2 text-[#1B2F5E] font-bold" aria-label="Close menu">
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
              {activeChild && paths && (
                <div className="flex items-center gap-3 pb-4 mb-4 border-b border-[#E5E7EB]">
                  <UserAvatar name={activeChild.name} avatarId={activeChild.avatar_id ?? null} size={40} />
                  <div>
                    <p className="font-bold text-[#1B2F5E]">{activeChild.name}</p>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${ageGroupBadgeClass(activeChild.age_group)}`}>
                      {ageGroupLabel(activeChild.age_group)}
                    </span>
                  </div>
                </div>
              )}

              {user && hasActiveChild && paths ? (
                <>
                  <MobileLink to={paths.home} onClick={closeAll}>Home</MobileLink>
                  <MobileLink to={paths.explore} onClick={closeAll}>Explore</MobileLink>
                  <MobileLink to={paths.journey} onClick={closeAll}>My Journey</MobileLink>
                  <button type="button" onClick={() => { setSearchOpen(true); closeAll() }} className="mobile-nav-btn">🔍 Search</button>
                  <div className="pt-4 mt-4 border-t border-[#E5E7EB] space-y-1">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#9CA3AF] px-1 pb-2">Parent Area 🔒</p>
                    <button type="button" onClick={() => openParent('/parent/dashboard')} className="mobile-nav-btn">Parent Dashboard</button>
                    <button type="button" onClick={() => openParent('/parent/progress')} className="mobile-nav-btn">Child Progress</button>
                    <button type="button" onClick={() => openParent('/parent/messages')} className="mobile-nav-btn">Messages</button>
                    <button type="button" onClick={() => openParent('/parent/settings')} className="mobile-nav-btn">Settings</button>
                    <MobileLink to="/parent/support" onClick={closeAll}>Support</MobileLink>
                  </div>
                  <button type="button" onClick={() => { closeAll(); void signOut() }} className="mobile-nav-btn text-[#E85D4A] mt-4">Sign Out</button>
                </>
              ) : user ? (
                <>
                  {PUBLIC_NAV_LINKS.map((link) => (
                    <MobileLink key={link.to} to={link.to} onClick={closeAll}>{link.label}</MobileLink>
                  ))}
                  <MobileLink to="/children" onClick={closeAll}>Select Child</MobileLink>
                  <button type="button" onClick={() => { closeAll(); void signOut() }} className="mobile-nav-btn text-[#E85D4A]">Sign Out</button>
                </>
              ) : (
                <>
                  {PUBLIC_NAV_LINKS.map((link) => (
                    <MobileLink key={link.to} to={link.to} onClick={closeAll}>{link.label}</MobileLink>
                  ))}
                  <MobileLink to="/login" onClick={closeAll}>Sign In</MobileLink>
                  <MobileLink to="/signup" onClick={closeAll}>Start Free</MobileLink>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function MobileLink({ to, children, onClick }: { to: string; children: ReactNode; onClick?: () => void }) {
  return (
    <Link to={to} onClick={onClick} className="mobile-nav-btn block">
      {children}
    </Link>
  )
}
