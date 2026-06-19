import UserAvatar from '@/components/UserAvatar'
import { CategoryTag } from '@/components/admin/messaging/AdminInboxSidebar'
import type { ConversationSummary } from '@/lib/messaging/types'
import { formatDateTime } from '@/lib/admin/utils'

interface AdminConversationListProps {
  conversations: ConversationSummary[]
  selectedId: string | null
  loading: boolean
  search: string
  onSearchChange: (value: string) => void
  onSelect: (id: string) => void
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  if (sameDay) {
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  }
  return formatDateTime(iso)
}

export default function AdminConversationList({
  conversations,
  selectedId,
  loading,
  search,
  onSearchChange,
  onSelect,
}: AdminConversationListProps) {
  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="p-3 border-b border-gray-100">
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search parent, email, child, subject…"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2AAFA0]"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <p className="text-sm text-gray-500 text-center py-10 m-0">Loading…</p>
        ) : conversations.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-10 px-4 m-0">
            No conversations in this folder.
          </p>
        ) : (
          <ul className="m-0 p-0 list-none">
            {conversations.map((c) => {
              const parent = c.parent
              const active = selectedId === c.id
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(c.id)}
                    className={`w-full text-left p-4 border-b border-gray-50 hover:bg-[#EEF4FF]/60 transition-colors ${
                      active ? 'bg-[#FFF8E7] border-l-4 border-l-[#F5A623]' : 'border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <UserAvatar
                        name={parent?.full_name ?? 'Parent'}
                        avatarId={null}
                        size={40}
                        variant="header"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2 mb-0.5">
                          <div className="min-w-0">
                            <p className="font-extrabold text-sm text-[#1B2F5E] m-0 truncate">
                              {parent?.full_name ?? 'Unknown parent'}
                            </p>
                            <p className="text-[11px] text-gray-500 m-0 truncate">
                              {parent?.email ?? 'No email on file'}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-[10px] text-gray-400 m-0">{formatTime(c.updated_at)}</p>
                            {c.unread_count > 0 && (
                              <span className="inline-block mt-1 bg-[#E85D4A] text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                {c.unread_count}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="font-bold text-xs text-[#1B2F5E] m-0 mt-1 line-clamp-1">{c.subject}</p>
                        <p className="text-xs text-gray-500 m-0 mt-0.5 line-clamp-2">
                          {c.last_message?.message ?? 'No messages yet'}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          <CategoryTag category={c.category} />
                          {c.priority === 'important' && (
                            <span className="text-[10px] font-bold text-amber-700">⭐ Important</span>
                          )}
                          {c.is_todo && (
                            <span className="text-[10px] font-bold text-teal-700">📌 To Do</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
