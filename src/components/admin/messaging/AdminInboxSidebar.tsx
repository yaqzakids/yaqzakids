import { Link } from 'react-router-dom'
import { ADMIN_INBOX_FOLDERS, categoryLabel, type AdminInboxFolder } from '@/lib/messaging/constants'
import type { AdminFolderCounts } from '@/lib/messaging/types'

interface AdminInboxSidebarProps {
  folder: AdminInboxFolder
  counts: AdminFolderCounts
  onFolderChange: (folder: AdminInboxFolder) => void
  onNewMessage: () => void
}

export default function AdminInboxSidebar({
  folder,
  counts,
  onFolderChange,
  onNewMessage,
}: AdminInboxSidebarProps) {
  return (
    <aside className="flex flex-col h-full bg-[#0F1D3A] text-white rounded-xl overflow-hidden">
      <div className="p-4 border-b border-white/10">
        <h2 className="font-display text-lg font-bold m-0">Messages</h2>
        <p className="text-xs text-white/60 m-0 mt-1">Admin ↔ Parent inbox</p>
      </div>

      <div className="p-3">
        <button
          type="button"
          onClick={onNewMessage}
          className="w-full py-2.5 px-4 rounded-lg bg-[#F5A623] text-[#0F1D3A] font-extrabold text-sm border-0 cursor-pointer hover:opacity-90"
        >
          ➕ New Message
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-3">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/40 px-2 mb-2">
          Folders
        </p>
        {ADMIN_INBOX_FOLDERS.map((item) => {
          const active = folder === item.value
          const count = counts[item.value] ?? 0
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onFolderChange(item.value)}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold border-0 cursor-pointer mb-0.5 ${
                active ? 'bg-white/15 text-white' : 'bg-transparent text-white/80 hover:bg-white/10'
              }`}
            >
              <span>
                {item.icon} {item.label}
              </span>
              {count > 0 && (
                <span
                  className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                    active ? 'bg-[#F5A623] text-[#0F1D3A]' : 'bg-white/15 text-white'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="p-3 border-t border-white/10 text-[11px] text-white/50">
        Broadcasts are managed in the Broadcast Center above.
      </div>
    </aside>
  )
}

export function CategoryTag({ category }: { category?: string }) {
  const colors: Record<string, string> = {
    general: 'bg-gray-100 text-gray-700',
    support: 'bg-blue-100 text-blue-800',
    billing: 'bg-amber-100 text-amber-800',
    learning: 'bg-teal-100 text-teal-800',
    feedback: 'bg-purple-100 text-purple-800',
  }
  const cls = colors[category ?? 'general'] ?? colors.general
  return (
    <span className={`inline-block text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full ${cls}`}>
      {categoryLabel(category ?? 'general')}
    </span>
  )
}

export function ParentQuickLinks({ parentId }: { parentId: string }) {
  return (
    <div className="space-y-2">
      <Link
        to={`/admin/users?search=${parentId}`}
        className="block text-xs font-bold text-[#2AAFA0] hover:underline"
      >
        View Parent Profile →
      </Link>
      <Link to="/admin/children" className="block text-xs font-bold text-[#2AAFA0] hover:underline">
        View Children →
      </Link>
      <Link to="/admin/subscriptions" className="block text-xs font-bold text-[#2AAFA0] hover:underline">
        View Subscription →
      </Link>
      <Link to="/admin/payments" className="block text-xs font-bold text-[#2AAFA0] hover:underline">
        View Payments →
      </Link>
    </div>
  )
}
