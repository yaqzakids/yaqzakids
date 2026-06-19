import {
  familyMessageTypeMeta,
  type FamilyFeedItem,
} from '@/lib/messaging/familyFeed'
import { formatDateTime } from '@/lib/admin/utils'

interface ParentMessageListProps {
  items: FamilyFeedItem[]
  selectedId: string | null
  loading: boolean
  onSelect: (item: FamilyFeedItem) => void
}

function formatCardDate(iso: string): string {
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

export default function ParentMessageList({
  items,
  selectedId,
  loading,
  onSelect,
}: ParentMessageListProps) {
  if (loading) {
    return (
      <div className="p-6 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-[#EEF4FF] animate-pulse" />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-4xl mb-3" aria-hidden>
          💌
        </p>
        <p className="text-sm text-[#6B7280] m-0 leading-relaxed">
          Nothing here yet. Announcements, achievements, and messages from the Yaqza team will appear
          here.
        </p>
      </div>
    )
  }

  return (
    <ul className="m-0 p-2 list-none space-y-2">
      {items.map((item) => {
        const meta = familyMessageTypeMeta(item.type)
        const active = selectedId === item.id
        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect(item)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                active
                  ? 'bg-[#FFF8E7] border-[#F5A623] shadow-sm'
                  : 'bg-white border-[#EEF4FF] hover:border-[#2AAFA0]/40 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl shrink-0 leading-none" aria-hidden>
                  {meta.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#2AAFA0] m-0">
                      {meta.label}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.unread && (
                        <span className="w-2 h-2 rounded-full bg-[#E85D4A]" aria-label="Unread" />
                      )}
                      <span className="text-[10px] text-[#9CA3AF]">{formatCardDate(item.date)}</span>
                    </div>
                  </div>
                  <p className="font-bold text-sm text-[#1B2F5E] m-0 line-clamp-2">{item.title.replace(/^[^\s]+\s/, '')}</p>
                  <p className="text-xs text-[#6B7280] m-0 mt-1 line-clamp-2">{item.preview}</p>
                </div>
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
