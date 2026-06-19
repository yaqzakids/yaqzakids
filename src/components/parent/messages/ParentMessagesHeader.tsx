import type { FamilyFeedTab } from '@/lib/messaging/familyFeed'

interface ParentMessagesHeaderProps {
  tab: FamilyFeedTab
  search: string
  onSearchChange: (value: string) => void
  totalUnread: number
  onTabChange: (tab: FamilyFeedTab) => void
  inboxUnread: number
  announcementsUnread: number
}

const TABS: { value: FamilyFeedTab; label: string }[] = [
  { value: 'inbox', label: 'Inbox' },
  { value: 'announcements', label: 'Announcements' },
  { value: 'archived', label: 'Archived' },
]

export default function ParentMessagesHeader({
  tab,
  search,
  onSearchChange,
  totalUnread,
  onTabChange,
  inboxUnread,
  announcementsUnread,
}: ParentMessagesHeaderProps) {
  return (
    <header className="mb-6">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-[#1B2F5E] m-0">Messages</h1>
            {totalUnread > 0 && (
              <span className="bg-[#E85D4A] text-white text-xs font-extrabold min-w-[24px] h-6 px-2 rounded-full inline-flex items-center justify-center">
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </div>
          <p className="text-sm text-[#6B7280] mt-1 m-0">Stay connected with YaqzaKids</p>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search title or message…"
          className="w-full max-w-xl border border-[#E2EBF8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#2AAFA0] shadow-sm"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const count =
            t.value === 'inbox' ? inboxUnread : t.value === 'announcements' ? announcementsUnread : 0
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => onTabChange(t.value)}
              className={`px-4 py-2 rounded-full text-sm font-extrabold border transition-colors ${
                tab === t.value
                  ? 'bg-[#1B2F5E] text-white border-[#1B2F5E]'
                  : 'bg-white text-[#1B2F5E] border-[#E2EBF8] hover:border-[#2AAFA0]'
              }`}
            >
              {t.label}
              {count > 0 && t.value !== 'archived' ? ` (${count})` : ''}
            </button>
          )
        })}
      </div>
    </header>
  )
}
