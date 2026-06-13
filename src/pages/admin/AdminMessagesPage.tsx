import { FormEvent, useCallback, useEffect, useState } from 'react'
import ErrorMessage from '@/components/ErrorMessage'
import BroadcastCenterCard from '@/components/admin/BroadcastCenterCard'
import MessageThread from '@/components/messaging/MessageThread'
import { MessagingListSkeleton, MessagingThreadSkeleton } from '@/components/messaging/MessagingSkeleton'
import SupportPagination from '@/components/support/SupportPagination'
import { useAuth } from '@/components/ProtectedRoute'
import {
  adminCreateConversation,
  fetchAdminConversationDetail,
  fetchAdminConversations,
  fetchParentsForSelect,
  markAdminConversationRead,
  resolveRecipientIds,
  sendAdminReply,
} from '@/lib/admin/messaging'
import { adminBtn, adminCard, adminInput, adminTextarea } from '@/lib/admin/styles'
import { ADMIN_SEND_AUDIENCES, type AdminSendAudience } from '@/lib/messaging/constants'
import type { ConversationDetail, ConversationSummary } from '@/lib/messaging/types'
import { formatDateTime } from '@/lib/admin/utils'
import { formatSupabaseError } from '@/lib/supabaseErrors'

export default function AdminMessagesPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<ConversationDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [sending, setSending] = useState(false)

  const [showCompose, setShowCompose] = useState(false)
  const [audience, setAudience] = useState<AdminSendAudience>('one')
  const [selectedParents, setSelectedParents] = useState<string[]>([])
  const [parents, setParents] = useState<{ id: string; full_name: string; email: string | null }[]>([])
  const [composeSubject, setComposeSubject] = useState('')
  const [composeMessage, setComposeMessage] = useState('')
  const [composing, setComposing] = useState(false)

  const pageSize = 15

  const loadList = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchAdminConversations({ search, page, pageSize })
      setConversations(result.data)
      setTotal(result.total)
    } catch (err) {
      setError(formatSupabaseError(err))
    } finally {
      setLoading(false)
    }
  }, [search, page, pageSize])

  const loadDetail = useCallback(async () => {
    if (!selectedId || !user) return
    setDetailLoading(true)
    try {
      const data = await fetchAdminConversationDetail(selectedId)
      setDetail(data)
      await markAdminConversationRead(user.id, selectedId)
    } catch (err) {
      setError(formatSupabaseError(err))
    } finally {
      setDetailLoading(false)
    }
  }, [selectedId, user])

  useEffect(() => {
    void loadList()
  }, [loadList])

  useEffect(() => {
    if (selectedId) void loadDetail()
    else setDetail(null)
  }, [selectedId, loadDetail])

  useEffect(() => {
    void fetchParentsForSelect().then(setParents)
  }, [])

  const handleSend = async (message: string) => {
    if (!user || !selectedId) return
    setSending(true)
    try {
      await sendAdminReply(user.id, selectedId, message)
      await loadDetail()
      await loadList()
    } catch (err) {
      setError(formatSupabaseError(err))
    } finally {
      setSending(false)
    }
  }

  const handleCompose = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return
    setComposing(true)
    setError(null)
    try {
      const recipientIds = await resolveRecipientIds(audience, selectedParents)
      const conversationId = await adminCreateConversation(
        user.id,
        composeSubject,
        composeMessage,
        recipientIds
      )
      setShowCompose(false)
      setComposeSubject('')
      setComposeMessage('')
      setSelectedParents([])
      setSelectedId(conversationId)
      await loadList()
    } catch (err) {
      setError(formatSupabaseError(err))
    } finally {
      setComposing(false)
    }
  }

  const toggleParent = (id: string) => {
    setSelectedParents((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  return (
    <div>
      <BroadcastCenterCard onRefreshConversations={() => void loadList()} />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <input
          style={{ ...adminInput, maxWidth: 320, flex: 1 }}
          placeholder="Search parent, email, subject, message…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
        <button type="button" style={adminBtn.primary} onClick={() => setShowCompose(true)}>
          New Conversation
        </button>
      </div>

      <h3
        className="font-bold m-0 mb-3 text-sm uppercase tracking-wide text-gray-500"
        style={{ letterSpacing: '0.06em' }}
      >
        One-to-One Conversations
      </h3>

      {error && <ErrorMessage message={error} onRetry={() => void loadList()} />}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div style={adminCard}>
          {loading ? (
            <MessagingListSkeleton />
          ) : conversations.length === 0 ? (
            <p className="text-sm text-gray-500 m-0">No conversations found.</p>
          ) : (
            <>
              <div style={{ overflow: 'auto', maxHeight: 520 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {conversations.map((c) => {
                      const parent = c.participants?.find((p) => p.user_type === 'parent')
                      return (
                        <tr
                          key={c.id}
                          onClick={() => setSelectedId(c.id)}
                          style={{
                            cursor: 'pointer',
                            background: selectedId === c.id ? '#fffbeb' : undefined,
                          }}
                        >
                          <td style={{ padding: '12px 8px', borderBottom: '1px solid #f3f4f6' }}>
                            <div className="font-semibold text-sm">{c.subject}</div>
                            <div className="text-xs text-gray-500">
                              {parent?.profile?.full_name ?? 'Parent'} · {formatDateTime(c.updated_at)}
                            </div>
                            <div className="text-xs text-gray-400 line-clamp-1">
                              {c.last_message?.message}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <SupportPagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
            </>
          )}
        </div>

        <div style={adminCard}>
          {!selectedId ? (
            <p className="text-sm text-gray-500 m-0 py-16 text-center">
              Select a conversation or start a new one.
            </p>
          ) : detailLoading || !detail ? (
            <MessagingThreadSkeleton />
          ) : (
            <>
              <h3 className="font-bold m-0 mb-1" style={{ fontFamily: 'Playfair Display, serif', color: '#1B2F5E' }}>
                {detail.subject}
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                {detail.participants
                  .filter((p) => p.user_type === 'parent')
                  .map((p) => p.profile?.full_name ?? p.user_id)
                  .join(', ')}
              </p>
              <MessageThread
                detail={detail}
                currentUserId={user!.id}
                onSend={handleSend}
                sending={sending}
                variant="admin"
              />
            </>
          )}
        </div>
      </div>

      {showCompose && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(9, 38, 74, 0.45)' }}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-navy m-0 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              New Conversation
            </h3>
            <form onSubmit={(e) => void handleCompose(e)} className="space-y-3">
              <div>
                <label className="block text-sm font-semibold mb-1">Send To</label>
                <select
                  style={adminInput}
                  value={audience}
                  onChange={(e) => setAudience(e.target.value as AdminSendAudience)}
                >
                  {ADMIN_SEND_AUDIENCES.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>

              {(audience === 'one' || audience === 'multiple') && (
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2 space-y-1">
                  {parents.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type={audience === 'one' ? 'radio' : 'checkbox'}
                        name="parent"
                        checked={selectedParents.includes(p.id)}
                        onChange={() => {
                          if (audience === 'one') setSelectedParents([p.id])
                          else toggleParent(p.id)
                        }}
                      />
                      {p.full_name} ({p.email ?? 'no email'})
                    </label>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold mb-1">Subject</label>
                <input style={adminInput} value={composeSubject} onChange={(e) => setComposeSubject(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Message</label>
                <textarea style={adminTextarea} value={composeMessage} onChange={(e) => setComposeMessage(e.target.value)} required />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" style={adminBtn.secondary} onClick={() => setShowCompose(false)}>
                  Cancel
                </button>
                <button type="submit" style={adminBtn.primary} disabled={composing}>
                  {composing ? 'Sending…' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
