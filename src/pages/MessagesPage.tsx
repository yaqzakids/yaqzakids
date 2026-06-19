import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/components/ProtectedRoute'
import ParentLayout from '@/components/layout/ParentLayout'
import ErrorMessage from '@/components/ErrorMessage'
import AnnouncementBanner from '@/components/messaging/AnnouncementBanner'
import MessageThread from '@/components/messaging/MessageThread'
import { MessagingListSkeleton, MessagingThreadSkeleton } from '@/components/messaging/MessagingSkeleton'
import SupportPagination from '@/components/support/SupportPagination'
import { useUnreadMessageCount } from '@/lib/messaging/useUnreadMessageCount'
import { INBOX_FILTERS, type InboxFilter } from '@/lib/messaging/constants'
import {
  archiveConversation,
  fetchConversationDetail,
  fetchParentConversations,
  markConversationRead,
  markConversationUnread,
  sendParentReply,
  unarchiveConversation,
} from '@/lib/messaging/parentMessaging'
import type { ConversationDetail, ConversationSummary } from '@/lib/messaging/types'
import { formatDateTime } from '@/lib/admin/utils'
import { formatSupabaseError } from '@/lib/supabaseErrors'

export default function MessagesPage() {
  const { user } = useAuth()
  const { refresh: refreshUnread } = useUnreadMessageCount(0)
  const [filter, setFilter] = useState<InboxFilter>('inbox')
  const [page, setPage] = useState(1)
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [total, setTotal] = useState(0)
  const [listLoading, setListLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<ConversationDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [sending, setSending] = useState(false)

  const pageSize = 12

  const loadList = useCallback(async () => {
    if (!user) return
    setListLoading(true)
    setError(null)
    try {
      const result = await fetchParentConversations(user.id, { filter, page, pageSize })
      setConversations(result.data)
      setTotal(result.total)
    } catch (err) {
      setError(formatSupabaseError(err))
    } finally {
      setListLoading(false)
    }
  }, [user, filter, page, pageSize])

  const loadDetail = useCallback(async () => {
    if (!user || !selectedId) return
    setDetailLoading(true)
    try {
      const data = await fetchConversationDetail(user.id, selectedId)
      setDetail(data)
      await markConversationRead(user.id, selectedId)
      await refreshUnread()
      await loadList()
    } catch (err) {
      setError(formatSupabaseError(err))
    } finally {
      setDetailLoading(false)
    }
  }, [user, selectedId, refreshUnread, loadList])

  useEffect(() => {
    void loadList()
  }, [loadList])

  useEffect(() => {
    if (selectedId) void loadDetail()
    else setDetail(null)
  }, [selectedId, loadDetail])

  const handleSend = async (message: string) => {
    if (!user || !selectedId) return
    setSending(true)
    try {
      await sendParentReply(user.id, selectedId, message)
      await loadDetail()
      await loadList()
      await refreshUnread()
    } catch (err) {
      setError(formatSupabaseError(err))
    } finally {
      setSending(false)
    }
  }

  const handleArchive = async () => {
    if (!user || !selectedId) return
    try {
      if (filter === 'archived') {
        await unarchiveConversation(user.id, selectedId)
      } else {
        await archiveConversation(user.id, selectedId)
      }
      setSelectedId(null)
      await loadList()
    } catch (err) {
      setError(formatSupabaseError(err))
    }
  }

  const handleMarkUnread = async () => {
    if (!user || !selectedId) return
    try {
      await markConversationUnread(user.id, selectedId)
      await refreshUnread()
      await loadList()
    } catch (err) {
      setError(formatSupabaseError(err))
    }
  }

  return (
    <ParentLayout active="messages">
      <div className="max-w-7xl mx-auto px-4 md:px-10 py-6 md:py-10">
        <div className="mb-6">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-navy m-0">Messages</h1>
          <p className="text-sm text-muted mt-1 m-0">Direct messages from the Yaqza Kids team</p>
        </div>

        <AnnouncementBanner compact />

        {error && <ErrorMessage message={error} onRetry={() => void loadList()} />}

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,360px)_1fr] gap-4 min-h-[560px]">
          <div className="bg-white rounded-[20px] shadow-lg border border-gray-100 overflow-hidden flex flex-col">
            <div className="p-3 border-b border-gray-100 flex flex-wrap gap-1">
              {INBOX_FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => {
                    setFilter(f.value)
                    setPage(1)
                    setSelectedId(null)
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-extrabold border ${
                    filter === f.value
                      ? 'bg-teal text-white border-teal'
                      : 'bg-white text-navy border-gray-200'
                  }`}
                >
                  {f.icon} {f.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto">
              {listLoading ? (
                <MessagingListSkeleton />
              ) : conversations.length === 0 ? (
                <p className="text-sm text-muted text-center py-10 px-4 m-0">
                  No messages in this folder.
                </p>
              ) : (
                <ul className="m-0 p-0 list-none">
                  {conversations.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(c.id)}
                        className={`w-full text-left p-4 border-b border-gray-50 hover:bg-teal/5 transition-colors ${
                          selectedId === c.id ? 'bg-teal/10 border-l-4 border-l-teal' : 'border-l-4 border-l-transparent'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="font-bold text-sm text-navy line-clamp-1">
                            {c.broadcast_id && (
                              <span className="text-gold mr-1" title="Announcement">
                                📢
                              </span>
                            )}
                            {c.subject}
                          </span>
                          {c.unread_count > 0 && (
                            <span className="shrink-0 bg-coral text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                              {c.unread_count}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted m-0 line-clamp-2">
                          {c.last_message?.message ?? 'No messages yet'}
                        </p>
                        <p className="text-[10px] text-muted mt-1 mb-0">
                          {formatDateTime(c.updated_at)}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="p-2 border-t border-gray-100">
              <SupportPagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
            </div>
          </div>

          <div className="bg-white rounded-[20px] shadow-lg border border-gray-100 overflow-hidden flex flex-col min-h-[480px]">
            {!selectedId ? (
              <p className="text-sm text-muted text-center py-20 m-0">
                Select a conversation to read and reply.
              </p>
            ) : detailLoading || !detail ? (
              <MessagingThreadSkeleton />
            ) : (
              <>
                <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2 bg-[#FAFBFD]">
                  <div>
                    {detail.broadcast_id && (
                      <span className="inline-block text-[10px] font-extrabold uppercase tracking-wide text-gold bg-gold/10 px-2 py-0.5 rounded-full mb-1">
                        📢 Announcement
                      </span>
                    )}
                    <h2 className="font-display font-bold text-navy m-0 text-lg">{detail.subject}</h2>
                    <p className="text-xs text-muted m-0">From Yaqza Kids · {formatDateTime(detail.updated_at)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void handleMarkUnread()}
                      className="text-xs font-bold text-navy border border-gray-200 rounded-full px-3 py-1.5 bg-white cursor-pointer hover:bg-gray-50"
                    >
                      Mark unread
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleArchive()}
                      className="text-xs font-bold text-teal border border-teal rounded-full px-3 py-1.5 bg-white cursor-pointer hover:bg-teal/5"
                    >
                      {filter === 'archived' ? 'Unarchive' : 'Archive'}
                    </button>
                  </div>
                </div>
                <MessageThread
                  detail={detail}
                  currentUserId={user!.id}
                  onSend={handleSend}
                  sending={sending}
                  variant="parent"
                  readOnly={Boolean(detail.broadcast_id)}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </ParentLayout>
  )
}
