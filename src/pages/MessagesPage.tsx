import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@/components/ProtectedRoute'
import ParentLayout from '@/components/layout/ParentLayout'
import ErrorMessage from '@/components/ErrorMessage'
import ParentMessagesHeader from '@/components/parent/messages/ParentMessagesHeader'
import ParentMessageList from '@/components/parent/messages/ParentMessageList'
import ParentMessageDetail from '@/components/parent/messages/ParentMessageDetail'
import { useFamilyNotificationCount } from '@/lib/messaging/useFamilyNotificationCount'
import {
  archiveFamilyFeedItem,
  countUnreadInFeed,
  fetchFamilyFeed,
  markFamilyFeedItemUnread,
  openFamilyFeedItem,
  searchFamilyFeed,
  unarchiveFamilyFeedItem,
  type FamilyFeedItem,
  type FamilyFeedTab,
} from '@/lib/messaging/familyFeed'
import { sendParentReply } from '@/lib/messaging/parentMessaging'
import type { ConversationDetail } from '@/lib/messaging/types'
import { formatSupabaseError } from '@/lib/supabaseErrors'
import { dismissAnnouncement } from '@/lib/messaging/parentMessaging'

export default function MessagesPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const messageParam = searchParams.get('message')
  const tab: FamilyFeedTab =
    tabParam === 'announcements' ? 'announcements' : tabParam === 'archived' ? 'archived' : 'inbox'

  const { refresh: refreshNotifications } = useFamilyNotificationCount(0)
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<FamilyFeedItem[]>([])
  const [inboxUnread, setInboxUnread] = useState(0)
  const [announcementsUnread, setAnnouncementsUnread] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<FamilyFeedItem | null>(null)
  const [detail, setDetail] = useState<ConversationDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [sending, setSending] = useState(false)

  const loadFeed = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const [feed, inboxItems, announcementItems] = await Promise.all([
        fetchFamilyFeed(user.id, tab),
        fetchFamilyFeed(user.id, 'inbox'),
        fetchFamilyFeed(user.id, 'announcements'),
      ])
      setItems(feed)
      setInboxUnread(countUnreadInFeed(inboxItems))
      setAnnouncementsUnread(countUnreadInFeed(announcementItems))
    } catch (err) {
      setError(formatSupabaseError(err))
    } finally {
      setLoading(false)
    }
  }, [user, tab])

  useEffect(() => {
    void loadFeed()
  }, [loadFeed])

  const filteredItems = useMemo(() => searchFamilyFeed(items, search), [items, search])

  useEffect(() => {
    if (!messageParam || loading || filteredItems.length === 0) return
    const match = filteredItems.find((item) => item.id === messageParam)
    if (match) setSelectedItem(match)
  }, [messageParam, loading, filteredItems])

  const openItem = useCallback(
    async (item: FamilyFeedItem) => {
      if (!user) return
      setSelectedItem(item)
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set('message', item.id)
        return next
      })

      if (item.conversationId) {
        setDetailLoading(true)
        try {
          const data = await openFamilyFeedItem(user.id, item)
          setDetail(data)
          await loadFeed()
          await refreshNotifications()
        } catch (err) {
          setError(formatSupabaseError(err))
        } finally {
          setDetailLoading(false)
        }
        return
      }

      setDetail(null)
      setDetailLoading(true)
      try {
        await openFamilyFeedItem(user.id, item)
        if (item.announcementId) {
          await dismissAnnouncement(user.id, item.announcementId)
        }
        await loadFeed()
        await refreshNotifications()
      } catch (err) {
        setError(formatSupabaseError(err))
      } finally {
        setDetailLoading(false)
      }
    },
    [user, loadFeed, refreshNotifications, setSearchParams]
  )

  useEffect(() => {
    if (selectedItem && !loading) {
      const stillExists = filteredItems.some((i) => i.id === selectedItem.id)
      if (!stillExists && !messageParam) {
        setSelectedItem(null)
        setDetail(null)
      }
    }
  }, [filteredItems, selectedItem, loading, messageParam])

  const handleTabChange = (next: FamilyFeedTab) => {
    setSelectedItem(null)
    setDetail(null)
    setSearchParams(next === 'inbox' ? {} : { tab: next })
  }

  const handleSend = async (message: string) => {
    if (!user || !selectedItem?.conversationId) return
    setSending(true)
    try {
      await sendParentReply(user.id, selectedItem.conversationId, message)
      const data = await openFamilyFeedItem(user.id, selectedItem)
      setDetail(data)
      await loadFeed()
      await refreshNotifications()
    } catch (err) {
      setError(formatSupabaseError(err))
    } finally {
      setSending(false)
    }
  }

  const handleArchive = async () => {
    if (!user || !selectedItem) return
    try {
      if (tab === 'archived') {
        await unarchiveFamilyFeedItem(user.id, selectedItem)
      } else {
        await archiveFamilyFeedItem(user.id, selectedItem)
      }
      setSelectedItem(null)
      setDetail(null)
      setSearchParams(tab === 'inbox' ? {} : { tab })
      await loadFeed()
      await refreshNotifications()
    } catch (err) {
      setError(formatSupabaseError(err))
    }
  }

  const handleMarkUnread = async () => {
    if (!user || !selectedItem) return
    try {
      await markFamilyFeedItemUnread(user.id, selectedItem)
      await loadFeed()
      await refreshNotifications()
    } catch (err) {
      setError(formatSupabaseError(err))
    }
  }

  const totalUnread = inboxUnread + announcementsUnread

  if (!user) {
    return (
      <ParentLayout active="messages" showSidebar bg="bg-[#FAFBFD]">
        <div className="py-20 text-center text-sm text-[#6B7280]">Loading your inbox…</div>
      </ParentLayout>
    )
  }

  return (
    <ParentLayout active="messages" showSidebar bg="bg-[#FAFBFD]">
      <ParentMessagesHeader
        tab={tab}
        search={search}
        onSearchChange={setSearch}
        totalUnread={totalUnread}
        inboxUnread={inboxUnread}
        announcementsUnread={announcementsUnread}
        onTabChange={handleTabChange}
      />

      {error && <ErrorMessage message={error} onRetry={() => void loadFeed()} />}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(300px,380px)_1fr] gap-4 min-h-[620px]">
        <div className="bg-white rounded-2xl border border-[#E2EBF8] shadow-sm overflow-hidden flex flex-col max-h-[75vh] xl:max-h-none">
          <div className="flex-1 overflow-y-auto">
            <ParentMessageList
              items={filteredItems}
              selectedId={selectedItem?.id ?? null}
              loading={loading}
              onSelect={(item) => void openItem(item)}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2EBF8] shadow-sm overflow-hidden flex flex-col min-h-[480px] max-h-[75vh] xl:max-h-none">
          <ParentMessageDetail
            item={selectedItem}
            detail={detail}
            detailLoading={detailLoading}
            currentUserId={user.id}
            sending={sending}
            tab={tab}
            onSend={handleSend}
            onArchive={() => void handleArchive()}
            onMarkUnread={() => void handleMarkUnread()}
          />
        </div>
      </div>
    </ParentLayout>
  )
}
