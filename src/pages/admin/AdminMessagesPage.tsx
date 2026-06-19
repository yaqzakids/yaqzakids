import { useCallback, useEffect, useState } from 'react'
import ErrorMessage from '@/components/ErrorMessage'
import BroadcastCenterCard from '@/components/admin/BroadcastCenterCard'
import AdminInboxSidebar from '@/components/admin/messaging/AdminInboxSidebar'
import AdminConversationList from '@/components/admin/messaging/AdminConversationList'
import AdminConversationPanel from '@/components/admin/messaging/AdminConversationPanel'
import AdminNewMessageModal from '@/components/admin/messaging/AdminNewMessageModal'
import { useAuth } from '@/components/ProtectedRoute'
import {
  adminCreateConversation,
  fetchAdminConversationDetail,
  fetchAdminConversations,
  fetchAdminFolderCounts,
  markAdminConversationRead,
  sendAdminReply,
  setAdminConversationFolder,
  updateAdminConversation,
} from '@/lib/admin/messaging'
import type { AdminInboxFolder } from '@/lib/messaging/constants'
import type { AdminFolderCounts, ConversationDetail, ConversationSummary } from '@/lib/messaging/types'
import { formatSupabaseError } from '@/lib/supabaseErrors'

const EMPTY_COUNTS: AdminFolderCounts = {
  inbox: 0,
  sent: 0,
  important: 0,
  todo: 0,
  scheduled: 0,
  archived: 0,
  trash: 0,
}

export default function AdminMessagesPage() {
  const { user } = useAuth()
  const [folder, setFolder] = useState<AdminInboxFolder>('inbox')
  const [search, setSearch] = useState('')
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [counts, setCounts] = useState<AdminFolderCounts>(EMPTY_COUNTS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<ConversationDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [showCompose, setShowCompose] = useState(false)
  const [composing, setComposing] = useState(false)

  const refreshCounts = useCallback(async () => {
    if (!user) return
    try {
      const next = await fetchAdminFolderCounts(user.id)
      setCounts(next)
    } catch {
      /* non-fatal */
    }
  }, [user])

  const loadList = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const result = await fetchAdminConversations({
        folder,
        search,
        adminId: user.id,
        pageSize: 50,
      })
      setConversations(result.data)
      await refreshCounts()
    } catch (err) {
      setError(formatSupabaseError(err))
    } finally {
      setLoading(false)
    }
  }, [user, folder, search, refreshCounts])

  const loadDetail = useCallback(async () => {
    if (!selectedId || !user) return
    setDetailLoading(true)
    try {
      const data = await fetchAdminConversationDetail(selectedId)
      setDetail(data)
      await markAdminConversationRead(user.id, selectedId)
      await refreshCounts()
    } catch (err) {
      setError(formatSupabaseError(err))
    } finally {
      setDetailLoading(false)
    }
  }, [selectedId, user, refreshCounts])

  useEffect(() => {
    void loadList()
  }, [loadList])

  useEffect(() => {
    if (selectedId) void loadDetail()
    else setDetail(null)
  }, [selectedId, loadDetail])

  const handleSend = async (message: string) => {
    if (!user || !selectedId || !detail) return
    setSending(true)
    try {
      const parentId = detail.parent_user_id ?? detail.parent?.id ?? null
      await sendAdminReply(user.id, selectedId, message, parentId)
      await loadDetail()
      await loadList()
    } catch (err) {
      setError(formatSupabaseError(err))
    } finally {
      setSending(false)
    }
  }

  const handleCompose = async (payload: {
    recipientId: string
    childProfileId: string | null
    subject: string
    message: string
    category: import('@/lib/messaging/constants').ConversationCategory
  }) => {
    if (!user) return
    setComposing(true)
    setError(null)
    try {
      const conversationId = await adminCreateConversation(
        user.id,
        payload.subject,
        payload.message,
        [payload.recipientId],
        { childProfileId: payload.childProfileId, category: payload.category }
      )
      setShowCompose(false)
      setFolder('sent')
      setSelectedId(conversationId)
      await loadList()
    } catch (err) {
      setError(formatSupabaseError(err))
      throw err
    } finally {
      setComposing(false)
    }
  }

  const handleAction = async (
    action: 'archive' | 'unarchive' | 'trash' | 'restore' | 'important' | 'unimportant' | 'todo' | 'untodo',
    conversationId?: string
  ) => {
    const targetId = conversationId ?? selectedId
    if (!user || !targetId) return
    try {
      await setAdminConversationFolder(user.id, targetId, action)
      if (action === 'trash') {
        setSelectedId(null)
        setFolder('trash')
      } else if (action === 'archive') {
        setSelectedId(null)
        setFolder('archived')
      } else if (action === 'restore') {
        setFolder('inbox')
      }
      await loadList()
      if (targetId === selectedId && action !== 'trash' && action !== 'archive') {
        await loadDetail()
      }
    } catch (err) {
      setError(formatSupabaseError(err))
    }
  }

  const handleNotesChange = async (notes: string) => {
    if (!selectedId) return
    await updateAdminConversation(selectedId, { internal_notes: notes })
    await loadDetail()
  }

  return (
    <div className="space-y-4">
      <BroadcastCenterCard onRefreshConversations={() => void loadList()} />

      {error && <ErrorMessage message={error} onRetry={() => void loadList()} />}

      <div
        className="grid gap-3 min-h-[680px]"
        style={{ gridTemplateColumns: '220px minmax(280px, 340px) 1fr' }}
      >
        <AdminInboxSidebar
          folder={folder}
          counts={counts}
          onFolderChange={(f) => {
            setFolder(f)
            setSelectedId(null)
          }}
          onNewMessage={() => setShowCompose(true)}
        />

        <AdminConversationList
          conversations={conversations}
          selectedId={selectedId}
          loading={loading}
          search={search}
          onSearchChange={setSearch}
          onSelect={setSelectedId}
          onTrash={(id) => void handleAction('trash', id)}
        />

        {!selectedId ? (
          <div className="flex items-center justify-center bg-white border border-gray-200 rounded-xl text-sm text-gray-500">
            Select a conversation or click ➕ New Message
          </div>
        ) : (
          <AdminConversationPanel
            detail={detail}
            loading={detailLoading}
            currentUserId={user!.id}
            sending={sending}
            onSend={handleSend}
            onAction={handleAction}
            onNotesChange={handleNotesChange}
          />
        )}
      </div>

      <AdminNewMessageModal
        open={showCompose}
        composing={composing}
        onClose={() => setShowCompose(false)}
        onSend={handleCompose}
      />
    </div>
  )
}
