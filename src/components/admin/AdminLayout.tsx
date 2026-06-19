import { NavLink, Outlet, useLocation, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/ProtectedRoute'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ADMIN_ROLE_LABELS,
  canAccessAdminPath,
  useAdminRole,
} from '@/context/AdminRoleContext'
import { AdminShellContext } from '@/context/AdminShellContext'
import { dashboardTheme } from '@/lib/admin/dashboardTheme'
import AdminAvatar from '@/components/admin/AdminAvatar'
import BrandLogo from '@/components/BrandLogo'
import Breadcrumbs from '@/components/navigation/Breadcrumbs'
import {
  DEFAULT_ADMIN_DISPLAY_NAME,
  DEFAULT_ADMIN_TITLE,
  DEFAULT_PUBLIC_CONTACT_EMAIL,
  loadAdminDisplay,
} from '@/lib/admin/adminProfile'

interface NavLinkItem {
  to: string
  label: string
  icon: string
  end?: boolean
  ownerOnly?: boolean
}

interface NavSection {
  title?: string
  items: NavLinkItem[]
}

const navSections: NavSection[] = [
  {
    items: [{ to: '/admin', label: 'Overview', icon: '📊', end: true }],
  },
  {
    title: 'Content',
    items: [
      { to: '/admin/content', label: 'Articles', icon: '📝' },
      { to: '/admin/quizzes', label: 'Quizzes', icon: '❓' },
      { to: '/admin/adventures?tab=pillars', label: 'Pillars', icon: '🏛️' },
      { to: '/admin/paths', label: 'Learning Paths', icon: '🗺️' },
      { to: '/admin/adventures?tab=badges', label: 'Badges', icon: '🏅' },
      { to: '/admin/adventures?tab=hero_cards', label: 'Hero Cards', icon: '🦸' },
    ],
  },
  {
    title: 'Users & Families',
    items: [
      { to: '/admin/families', label: 'Parents', icon: '👤' },
      { to: '/admin/children', label: 'Child Profiles', icon: '👶' },
      { to: '/admin/progress', label: 'Progress', icon: '📈' },
    ],
  },
  {
    title: 'Payments',
    items: [
      { to: '/admin/payments', label: 'Payments & Access', icon: '💳' },
      { to: '/admin/pricing', label: 'Pricing & Plans', icon: '🏷️' },
      { to: '/admin/discounts', label: 'Discount Codes', icon: '🎟️' },
      { to: '/admin/refunds', label: 'Refunds', icon: '↩️' },
    ],
  },
  {
    title: 'Support',
    items: [
      { to: '/admin/support', label: 'Support Tickets', icon: '🎫' },
      { to: '/admin/messages', label: 'Messages', icon: '💬' },
      { to: '/admin/announcements', label: 'Announcements', icon: '📢' },
    ],
  },
  {
    title: 'Analytics',
    items: [{ to: '/admin/analytics', label: 'Analytics', icon: '📈' }],
  },
  {
    title: 'Settings',
    items: [
      { to: '/admin/settings', label: 'Settings', icon: '⚙️' },
      { to: '/admin/settings/profile', label: 'Profile Settings', icon: '👤' },
      { to: '/admin/team', label: 'Team / Employees', icon: '🛡️', ownerOnly: true },
      { to: '/admin/log', label: 'Admin Activity Log', icon: '📋' },
    ],
  },
]

const titles: Record<string, string> = {
  '/admin': 'Overview',
  '/admin/content': 'Content',
  '/admin/quizzes': 'Quizzes',
  '/admin/adventures': 'Adventures',
  '/admin/families': 'Users & Families',
  '/admin/progress': 'Progress',
  '/admin/payments': 'Payments & Access',
  '/admin/pricing': 'Pricing & Plans',
  '/admin/refunds': 'Refunds',
  '/admin/support': 'Support',
  '/admin/messages': 'Messages',
  '/admin/announcements': 'Announcements',
  '/admin/analytics': 'Analytics',
  '/admin/settings': 'Settings',
  '/admin/settings/profile': 'Profile Settings',
  '/admin/team': 'Team / Employee Accounts',
  '/admin/log': 'Admin Activity Log',
  '/admin/articles': 'Articles',
  '/admin/paths': 'Learning Paths',
  '/admin/users': 'Users',
  '/admin/children': 'Children',
  '/admin/subscriptions': 'Subscriptions',
  '/admin/discounts': 'Discount Codes',
}

function getTitle(pathname: string): string {
  if (pathname.startsWith('/admin/articles/')) return 'Article Editor'
  if (pathname.startsWith('/admin/paths/')) return 'Path Editor'
  if (pathname.startsWith('/admin/quizzes/')) return 'Quiz Editor'
  return titles[pathname] ?? 'Admin'
}

function navLinkClass(isActive: boolean) {
  return `flex items-center gap-2.5 px-3 py-2 rounded-lg mb-0.5 text-[13px] no-underline transition-colors ${
    isActive ? 'font-semibold' : 'text-white/75 hover:bg-white/10 hover:text-white'
  }`
}

function SidebarLink({ item, onNavigate }: { item: NavLinkItem; onNavigate: () => void }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) => navLinkClass(isActive)}
      style={({ isActive }) =>
        isActive
          ? { background: dashboardTheme.sidebarActive, color: dashboardTheme.sidebarActiveText }
          : undefined
      }
    >
      <span className="w-5 text-center shrink-0">{item.icon}</span>
      <span>{item.label}</span>
    </NavLink>
  )
}

function AdminProfileDetails({
  variant,
  name,
  authEmail,
  title,
  contactEmail,
  roleLabel,
}: {
  variant: 'sidebar' | 'header'
  name: string
  authEmail: string | null
  title: string
  contactEmail: string
  roleLabel: string
}) {
  const isSidebar = variant === 'sidebar'

  return (
    <div className="min-w-0 flex-1">
      <div
        className={`truncate ${isSidebar ? 'text-sm text-white font-semibold' : 'text-sm font-semibold'}`}
        style={isSidebar ? undefined : { color: dashboardTheme.navy }}
      >
        {name}
      </div>
      {authEmail && (
        <div
          className="truncate mt-0.5"
          style={{
            fontSize: 12,
            color: isSidebar ? 'rgba(255,255,255,0.55)' : '#6B7280',
          }}
          title={authEmail}
        >
          {authEmail}
        </div>
      )}
      <div
        className={`truncate text-[11px] mt-0.5 ${isSidebar ? 'text-white/55' : 'text-[#6B7280]'}`}
      >
        {title}
      </div>
      <div
        className={`truncate text-[10px] mt-0.5 ${isSidebar ? 'text-white/45' : 'text-[#9CA3AF]'}`}
        title={contactEmail}
      >
        {contactEmail}
      </div>
      <div
        className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded inline-block mt-1"
        style={
          isSidebar
            ? { background: 'rgba(245,166,35,0.2)', color: dashboardTheme.gold }
            : { background: '#FEF3C7', color: '#B45309' }
        }
      >
        {roleLabel}
      </div>
    </div>
  )
}

export default function AdminLayout() {
  const { user } = useAuth()
  const location = useLocation()
  const { adminRole, isOwner } = useAdminRole()
  const [adminName, setAdminName] = useState(DEFAULT_ADMIN_DISPLAY_NAME)
  const [adminTitle, setAdminTitle] = useState(DEFAULT_ADMIN_TITLE)
  const [publicContactEmail, setPublicContactEmail] = useState(DEFAULT_PUBLIC_CONTACT_EMAIL)
  const [avatarId, setAvatarId] = useState<string | null>(null)
  const [authEmail, setAuthEmail] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)

  const loadAdminProfile = useCallback(async () => {
    if (!user) return
    const display = await loadAdminDisplay(user.id)
    setAdminName(display.displayName)
    setAdminTitle(display.title)
    setPublicContactEmail(display.publicContactEmail)
    setAvatarId(display.avatarId)
  }, [user])

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      setAuthEmail(data.user?.email ?? null)
    })
  }, [user?.id])

  useEffect(() => {
    loadAdminProfile().catch(() => {})
  }, [loadAdminProfile])

  useEffect(() => {
    if (!profileMenuOpen) return
    const handleClick = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [profileMenuOpen])

  const refreshAdminProfile = useCallback(async () => {
    await loadAdminProfile()
  }, [loadAdminProfile])

  const signOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/admin/login'
  }

  const visibleNavSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          (!item.ownerOnly || isOwner) && canAccessAdminPath(adminRole, item.to.split('?')[0] ?? item.to)
      ),
    }))
    .filter((section) => section.items.length > 0)

  const pageTitle = getTitle(location.pathname)
  const isOverview = location.pathname === '/admin'
  const roleLabel = ADMIN_ROLE_LABELS[adminRole]

  return (
    <AdminShellContext.Provider
      value={{
        adminName,
        adminTitle,
        publicContactEmail,
        avatarId,
        searchQuery,
        setSearchQuery,
        refreshAdminProfile,
      }}
    >
      <div className="flex min-h-screen" style={{ fontFamily: 'Nunito, sans-serif', background: dashboardTheme.cream }}>
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden />
        )}

        <aside
          className={`fixed lg:fixed inset-y-0 left-0 z-50 w-[260px] flex flex-col shrink-0 transition-transform duration-200 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
          style={{ background: dashboardTheme.sidebar }}
        >
          <div className="px-5 py-5 border-b border-white/10 shrink-0">
            <BrandLogo height={36} />
            <div className="text-[11px] text-white/50 mt-2 tracking-wide uppercase">Admin Control Center</div>
          </div>

          <nav className="flex-1 min-h-0 px-3 py-4 overflow-y-auto overscroll-contain">
            {visibleNavSections.map((section, si) => (
              <div key={si} className={si > 0 ? 'mt-5 pt-4 border-t border-white/10' : ''}>
                {section.title && (
                  <div
                    className="px-3 mb-2.5 text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: 'rgba(245, 166, 35, 0.55)' }}
                  >
                    {section.title}
                  </div>
                )}
                {section.items.map((item) => (
                  <SidebarLink key={`${item.to}-${item.label}`} item={item} onNavigate={() => setSidebarOpen(false)} />
                ))}
              </div>
            ))}
          </nav>

          <div className="p-4 border-t border-white/10 space-y-2 shrink-0">
            <Link
              to="/welcome"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-3 text-sm font-semibold rounded-lg no-underline transition-colors"
              style={{ background: 'rgba(255,255,255,0.08)', color: '#fff' }}
            >
              🌐 View Site
            </Link>
            <div className="flex items-center gap-3 px-1 py-2">
              <AdminAvatar name={adminName} avatarId={avatarId} size={36} variant="sidebar" />
              <AdminProfileDetails
                variant="sidebar"
                name={adminName}
                authEmail={authEmail}
                title={adminTitle}
                contactEmail={publicContactEmail}
                roleLabel={roleLabel}
              />
            </div>
            <button
              type="button"
              onClick={signOut}
              className="w-full py-2.5 px-3 text-sm font-semibold rounded-lg border-0 cursor-pointer transition-colors"
              style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}
            >
              Sign Out
            </button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0 lg:ml-[260px]">
          <header
            className="sticky top-0 z-30 px-4 md:px-8 py-4 flex flex-wrap items-center gap-3 md:gap-4"
            style={{ background: dashboardTheme.cream, borderBottom: `1px solid ${dashboardTheme.border}` }}
          >
            <button
              type="button"
              className="lg:hidden bg-white border-0 text-xl cursor-pointer w-10 h-10 rounded-xl shadow-sm"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              ☰
            </button>

            <div className="flex-1 min-w-[140px]">
              {!isOverview && (
                <Breadcrumbs
                  items={[
                    { label: 'Admin', to: '/admin' },
                    { label: pageTitle },
                  ]}
                  className="mb-2"
                />
              )}
              {!isOverview && (
                <h1
                  className="m-0 text-xl md:text-2xl font-bold"
                  style={{ fontFamily: 'Playfair Display, serif', color: dashboardTheme.navy }}
                >
                  {pageTitle}
                </h1>
              )}
              {!isOverview && (
                <p className="m-0 text-xs text-[#6B7280] mt-0.5 hidden sm:block">
                  Welcome back, {adminName.split(' ')[0]} 👋
                </p>
              )}
            </div>

            <div
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl flex-1 max-w-md min-w-[200px]"
              style={{ background: dashboardTheme.white, border: `1px solid ${dashboardTheme.border}`, boxShadow: dashboardTheme.shadowSm }}
            >
              <span className="text-[#9CA3AF]">🔍</span>
              <input
                type="search"
                placeholder="Search anything…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 border-0 outline-none text-sm bg-transparent"
                style={{ fontFamily: 'Nunito, sans-serif' }}
              />
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                title="Notifications"
                className="w-10 h-10 rounded-xl border-0 cursor-pointer text-lg flex items-center justify-center"
                style={{ background: dashboardTheme.white, boxShadow: dashboardTheme.shadowSm }}
              >
                🔔
              </button>
              <button
                type="button"
                title="Help"
                className="w-10 h-10 rounded-xl border-0 cursor-pointer text-lg flex items-center justify-center"
                style={{ background: dashboardTheme.white, boxShadow: dashboardTheme.shadowSm }}
              >
                ❓
              </button>
              <div className="relative hidden sm:block" ref={profileMenuRef}>
                <button
                  type="button"
                  className="flex items-center gap-2 pl-2 min-w-0 max-w-[240px] md:max-w-[280px] border-0 bg-transparent cursor-pointer p-0 text-left"
                  onClick={() => setProfileMenuOpen((open) => !open)}
                  aria-expanded={profileMenuOpen}
                  aria-haspopup="menu"
                >
                  <AdminAvatar name={adminName} avatarId={avatarId} size={36} variant="header" />
                  <AdminProfileDetails
                    variant="header"
                    name={adminName}
                    authEmail={authEmail}
                    title={adminTitle}
                    contactEmail={publicContactEmail}
                    roleLabel={roleLabel}
                  />
                </button>
                {profileMenuOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 min-w-[200px] rounded-xl border shadow-lg py-1 z-50"
                    style={{ background: dashboardTheme.white, borderColor: dashboardTheme.border }}
                    role="menu"
                  >
                    <Link
                      to="/admin/settings/profile"
                      className="block px-4 py-2.5 text-sm no-underline hover:bg-gray-50"
                      style={{ color: dashboardTheme.navy }}
                      onClick={() => setProfileMenuOpen(false)}
                      role="menuitem"
                    >
                      Profile Settings
                    </Link>
                    <button
                      type="button"
                      className="block w-full text-left px-4 py-2.5 text-sm border-0 bg-transparent cursor-pointer hover:bg-gray-50"
                      style={{ color: '#dc2626' }}
                      onClick={() => {
                        setProfileMenuOpen(false)
                        signOut()
                      }}
                      role="menuitem"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-8 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </AdminShellContext.Provider>
  )
}
