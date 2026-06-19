import { useLocation } from 'react-router-dom'
import ParentGateLink from '@/components/parent/ParentGateLink'
import ParentPasscodeGate from '@/components/parent/ParentPasscodeGate'
import { useFamilyNotificationCount } from '@/lib/messaging/useFamilyNotificationCount'

const NAV_ITEMS: {
  to: string
  label: string
  icon: string
  gated: boolean
  badge?: boolean
}[] = [
  { to: '/parent/dashboard', label: 'Children', icon: '👨‍👩‍👧', gated: false },
  { to: '/parent/dashboard', label: 'Progress', icon: '📊', gated: false },
  { to: '/parent/messages', label: 'Messages', icon: '💬', gated: false, badge: true },
  { to: '/parent/messages?tab=announcements', label: 'Announcements', icon: '📢', gated: false },
  { to: '/account/settings', label: 'Subscription', icon: '💳', gated: true },
  { to: '/account/settings', label: 'Settings', icon: '⚙️', gated: true },
  { to: '/support', label: 'Support', icon: '🆘', gated: false },
]

function NavItem({
  to,
  label,
  icon,
  gated,
  badge,
  active,
  unreadCount,
}: {
  to: string
  label: string
  icon: string
  gated: boolean
  badge?: boolean
  active: boolean
  unreadCount: number
}) {
  const className = `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold no-underline transition-colors ${
    active
      ? 'bg-white text-[#1B2F5E] shadow-sm border border-[#E2EBF8]'
      : 'text-[#1B2F5E]/80 hover:bg-white/70 hover:text-[#1B2F5E]'
  }`

  const content = (
    <>
      <span className="text-lg shrink-0" aria-hidden>
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {gated && <span className="text-[10px] opacity-60">🔒</span>}
      {badge && unreadCount > 0 && (
        <span className="bg-[#E85D4A] text-white text-[10px] font-extrabold min-w-[20px] h-5 px-1.5 rounded-full inline-flex items-center justify-center">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </>
  )

  if (gated) {
    return (
      <ParentPasscodeGate alwaysRequire>
        <ParentGateLink to={to} className={className}>
          {content}
        </ParentGateLink>
      </ParentPasscodeGate>
    )
  }

  return (
    <ParentGateLink to={to} className={className}>
      {content}
    </ParentGateLink>
  )
}

export default function ParentAreaSidebar({ active }: { active?: string }) {
  const location = useLocation()
  const { count } = useFamilyNotificationCount()

  const isActive = (to: string, label: string) => {
    if (active) return active === label.toLowerCase()
    if (label === 'Messages') {
      return location.pathname === '/parent/messages' && !location.search.includes('tab=announcements')
    }
    if (label === 'Announcements') {
      return location.pathname === '/parent/messages' && location.search.includes('tab=announcements')
    }
    return location.pathname === to || location.pathname.startsWith(`${to}/`)
  }

  return (
    <aside className="w-full lg:w-[240px] shrink-0">
      <div className="bg-[#EEF4FF]/80 border border-[#E2EBF8] rounded-2xl p-4 sticky top-24">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#6B7280] m-0 mb-3 px-1">
          🔒 Parent Area
        </p>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavItem
              key={`${item.to}-${item.label}`}
              {...item}
              active={isActive(item.to, item.label)}
              unreadCount={item.badge ? count : 0}
            />
          ))}
        </nav>
        <p className="text-[11px] text-[#6B7280] leading-relaxed mt-4 mb-0 px-1">
          PIN-protected area for parents only. Children cannot access these pages.
        </p>
      </div>
    </aside>
  )
}
