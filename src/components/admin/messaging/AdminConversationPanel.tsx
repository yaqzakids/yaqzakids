import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import UserAvatar from '@/components/UserAvatar'
import MessageThread from '@/components/messaging/MessageThread'
import { MessagingThreadSkeleton } from '@/components/messaging/MessagingSkeleton'
import { CategoryTag, ParentQuickLinks } from '@/components/admin/messaging/AdminInboxSidebar'
import type { ConversationDetail } from '@/lib/messaging/types'
import { formatDateTime } from '@/lib/admin/utils'
import { AGE_GROUP_META } from '@/lib/childProfiles'

interface AdminConversationPanelProps {
  detail: ConversationDetail | null
  loading: boolean
  currentUserId: string
  sending: boolean
  onSend: (message: string) => Promise<void>
  onAction: (
    action: 'archive' | 'unarchive' | 'trash' | 'restore' | 'important' | 'unimportant' | 'todo' | 'untodo'
  ) => Promise<void>
  onNotesChange: (notes: string) => Promise<void>
}

export default function AdminConversationPanel({
  detail,
  loading,
  currentUserId,
  sending,
  onSend,
  onAction,
  onNotesChange,
}: AdminConversationPanelProps) {
  const [notes, setNotes] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const [savingNotes, setSavingNotes] = useState(false)

  useEffect(() => {
    setNotes(detail?.internal_notes ?? '')
  }, [detail?.id, detail?.internal_notes])

  if (loading || !detail) {
    return (
      <div className="h-full bg-white border border-gray-200 rounded-xl overflow-hidden">
        <MessagingThreadSkeleton />
      </div>
    )
  }

  const parent = detail.parent
  const parentSince = parent?.created_at
    ? new Date(parent.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : '—'

  const handleSaveNotes = async () => {
    setSavingNotes(true)
    try {
      await onNotesChange(notes)
    } finally {
      setSavingNotes(false)
    }
  }

  return (
    <div className="flex h-full min-h-[640px] bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 border-r border-gray-100">
        <header className="p-4 border-b border-gray-100 bg-[#FAFBFD]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <UserAvatar name={parent?.full_name ?? 'Parent'} avatarId={null} size={48} variant="profile" />
              <div className="min-w-0">
                <h3 className="font-display text-lg font-bold text-[#1B2F5E] m-0 truncate">
                  {parent?.full_name ?? 'Unknown parent'}
                </h3>
                <p className="text-sm text-[#2AAFA0] font-semibold m-0 truncate">
                  {parent?.email ?? 'No email on file'}
                </p>
                {parent && parent.children.length > 0 && (
                  <p className="text-xs text-gray-600 m-0 mt-1">
                    Children:{' '}
                    {parent.children
                      .map((c) => `${c.name} (${AGE_GROUP_META[c.age_group].label})`)
                      .join(' · ')}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mt-2 text-[11px] text-gray-500">
                  <span>Parent since {parentSince}</span>
                  <span>·</span>
                  <span>Plan: {parent?.subscription?.label ?? 'Free'}</span>
                  <span>·</span>
                  <span className="font-mono">ID: {detail.id.slice(0, 8)}…</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                title="Mark important"
                onClick={() => void onAction(detail.priority === 'important' ? 'unimportant' : 'important')}
                className="p-2 rounded-lg border border-gray-200 bg-white cursor-pointer text-sm"
              >
                ⭐
              </button>
              <button
                type="button"
                title="Mark to do"
                onClick={() => void onAction(detail.is_todo ? 'untodo' : 'todo')}
                className="p-2 rounded-lg border border-gray-200 bg-white cursor-pointer text-sm"
              >
                📌
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowMenu((v) => !v)}
                  className="p-2 rounded-lg border border-gray-200 bg-white cursor-pointer text-sm"
                >
                  ⋮
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 z-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[140px]">
                    <button
                      type="button"
                      className="block w-full text-left px-3 py-2 text-xs font-bold border-0 bg-transparent cursor-pointer hover:bg-gray-50"
                      onClick={() => {
                        setShowMenu(false)
                        void onAction(detail.status === 'archived' ? 'unarchive' : 'archive')
                      }}
                    >
                      {detail.status === 'archived' ? 'Unarchive' : 'Archive'}
                    </button>
                    <button
                      type="button"
                      className="block w-full text-left px-3 py-2 text-xs font-bold border-0 bg-transparent cursor-pointer hover:bg-gray-50 text-red-600"
                      onClick={() => {
                        setShowMenu(false)
                        void onAction(detail.status === 'trashed' ? 'restore' : 'trash')
                      }}
                    >
                      {detail.status === 'trashed' ? 'Restore' : 'Move to Trash'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <CategoryTag category={detail.category} />
            <span className="text-[11px] text-gray-500">
              Created {formatDateTime(detail.created_at)} · Updated {formatDateTime(detail.updated_at)}
            </span>
          </div>
          <h2 className="font-display font-bold text-[#1B2F5E] m-0 mt-3 text-base">{detail.subject}</h2>
        </header>

        <div className="flex-1 min-h-0">
          <MessageThread
            detail={detail}
            currentUserId={currentUserId}
            onSend={onSend}
            sending={sending}
            variant="admin"
          />
        </div>
      </div>

      <aside className="w-[260px] shrink-0 hidden xl:flex flex-col bg-[#FAFBFD] overflow-y-auto">
        <section className="p-4 border-b border-gray-100">
          <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 m-0 mb-3">
            Conversation Info
          </h4>
          <dl className="space-y-2 text-xs m-0">
            <div>
              <dt className="text-gray-500 font-semibold">Status</dt>
              <dd className="font-bold text-[#1B2F5E] m-0 capitalize">{detail.status ?? 'open'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 font-semibold">Priority</dt>
              <dd className="font-bold text-[#1B2F5E] m-0 capitalize">{detail.priority ?? 'normal'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 font-semibold">Category</dt>
              <dd className="m-0 mt-1">
                <CategoryTag category={detail.category} />
              </dd>
            </div>
          </dl>
          <div className="mt-4 space-y-2">
            <button
              type="button"
              onClick={() => void onAction(detail.priority === 'important' ? 'unimportant' : 'important')}
              className="w-full text-left text-xs font-bold text-[#1B2F5E] py-2 px-3 rounded-lg border border-gray-200 bg-white cursor-pointer"
            >
              ⭐ Mark Important
            </button>
            <button
              type="button"
              onClick={() => void onAction(detail.is_todo ? 'untodo' : 'todo')}
              className="w-full text-left text-xs font-bold text-[#1B2F5E] py-2 px-3 rounded-lg border border-gray-200 bg-white cursor-pointer"
            >
              📌 Mark To Do
            </button>
            <button
              type="button"
              onClick={() => void onAction(detail.status === 'archived' ? 'unarchive' : 'archive')}
              className="w-full text-left text-xs font-bold text-[#1B2F5E] py-2 px-3 rounded-lg border border-gray-200 bg-white cursor-pointer"
            >
              📦 Archive
            </button>
            <button
              type="button"
              onClick={() => void onAction(detail.status === 'trashed' ? 'restore' : 'trash')}
              className="w-full text-left text-xs font-bold text-red-600 py-2 px-3 rounded-lg border border-gray-200 bg-white cursor-pointer"
            >
              {detail.status === 'trashed' ? '♻️ Restore from Trash' : '🗑 Move to Trash'}
            </button>
          </div>
        </section>

        <section className="p-4 border-b border-gray-100">
          <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 m-0 mb-2">
            Internal Notes
          </h4>
          <textarea
            value={notes || detail.internal_notes || ''}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full text-xs border border-gray-200 rounded-lg p-2 min-h-[80px] resize-y"
            placeholder="Notes visible to admins only…"
          />
          <button
            type="button"
            disabled={savingNotes}
            onClick={() => void handleSaveNotes()}
            className="mt-2 text-xs font-bold text-[#2AAFA0] border-0 bg-transparent cursor-pointer p-0"
          >
            {savingNotes ? 'Saving…' : 'Save notes'}
          </button>
        </section>

        {parent && (
          <section className="p-4">
            <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 m-0 mb-3">
              Parent Profile
            </h4>
            <ParentQuickLinks parentId={parent.id} />
            <Link
              to={`/admin/messages?parent=${parent.id}`}
              className="block text-xs font-bold text-gray-500 mt-3 hover:underline"
            >
              Filter by this parent
            </Link>
          </section>
        )}
      </aside>
    </div>
  )
}
