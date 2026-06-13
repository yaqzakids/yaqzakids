import { useUnreadMessageCount } from '@/lib/messaging/useUnreadMessageCount'
import ParentGateLink from '@/components/parent/ParentGateLink'

interface ParentNavLinksProps {
  active?: 'messages' | 'support' | 'dashboard'
}

export default function ParentNavLinks({ active }: ParentNavLinksProps) {
  const { count } = useUnreadMessageCount()

  const linkClass = (key: 'messages' | 'support' | 'dashboard') =>
    `text-sm font-bold no-underline transition-colors ${
      active === key ? 'text-navy' : 'text-teal hover:text-navy'
    }`

  return (
    <div className="flex items-center gap-4 md:gap-6">
      <ParentGateLink to="/parent/dashboard" className={linkClass('dashboard')}>
        Dashboard
      </ParentGateLink>
      <ParentGateLink to="/support" className={linkClass('support')}>
        Support
      </ParentGateLink>
      <ParentGateLink to="/messages" className={`${linkClass('messages')} inline-flex items-center gap-1.5`}>
        <span aria-hidden>🔔</span>
        Messages
        {count > 0 && (
          <span className="bg-coral text-white text-[10px] font-extrabold min-w-[18px] h-[18px] px-1 rounded-full inline-flex items-center justify-center">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </ParentGateLink>
    </div>
  )
}
