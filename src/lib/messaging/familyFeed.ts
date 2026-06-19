import { supabase } from '@/lib/supabase'
import type { BroadcastType } from '@/lib/messaging/constants'
import {
  archiveConversation,
  fetchActiveAnnouncementsForParent,
  fetchConversationDetail,
  fetchParentConversations,
  markConversationRead,
  markConversationUnread,
  unarchiveConversation,
} from '@/lib/messaging/parentMessaging'
import type { ConversationDetail, ConversationSummary } from '@/lib/messaging/types'
import type { SubscriptionPlan } from '@/lib/types'
import {
  archiveSyntheticFeedItem,
  isSyntheticFeedItemArchived,
  isSyntheticFeedItemRead,
  markSyntheticFeedItemRead,
  markSyntheticFeedItemUnread,
  unarchiveSyntheticFeedItem,
} from '@/lib/messaging/familyFeedStorage'

export type FamilyMessageType =
  | 'direct'
  | 'announcement'
  | 'achievement'
  | 'certificate'
  | 'subscription'

export type FamilyFeedTab = 'inbox' | 'announcements' | 'archived'

export interface FamilyFeedAction {
  label: string
  href: string
  primary?: boolean
}

export interface FamilyFeedItem {
  id: string
  type: FamilyMessageType
  title: string
  preview: string
  body: string
  date: string
  unread: boolean
  archived: boolean
  conversationId?: string
  announcementId?: string
  childName?: string
  childProfileId?: string
  actions: FamilyFeedAction[]
  readOnly: boolean
}

const PAID_PLANS: SubscriptionPlan[] = ['family_monthly', 'family_yearly', 'homeschool', 'school']

const TYPE_META: Record<FamilyMessageType, { icon: string; label: string }> = {
  direct: { icon: '💬', label: 'Direct Message' },
  announcement: { icon: '📢', label: 'Announcement' },
  achievement: { icon: '🏆', label: 'Achievement' },
  certificate: { icon: '🎓', label: 'Certificate' },
  subscription: { icon: '💳', label: 'Subscription' },
}

export function familyMessageTypeMeta(type: FamilyMessageType) {
  return TYPE_META[type]
}

function broadcastIcon(type: BroadcastType | null | undefined): string {
  switch (type) {
    case 'path':
      return '🗺️'
    case 'eid':
      return '🌙'
    case 'maintenance':
      return '🔧'
    case 'subscription':
      return '💳'
    case 'feature':
      return '✨'
    default:
      return '📢'
  }
}

function conversationToFeedItem(
  conv: ConversationSummary,
  broadcastType?: BroadcastType | null
): FamilyFeedItem {
  const isBroadcast = Boolean(conv.broadcast_id)
  const isBilling = conv.category === 'billing'
  const type: FamilyMessageType = isBroadcast
    ? 'announcement'
    : isBilling
      ? 'subscription'
      : 'direct'

  const preview = conv.last_message?.message ?? 'No messages yet'
  const icon = isBroadcast ? broadcastIcon(broadcastType) : familyMessageTypeMeta(type).icon

  return {
    id: `conv:${conv.id}`,
    type,
    title: `${icon} ${conv.subject}`,
    preview,
    body: preview,
    date: conv.updated_at,
    unread: conv.unread_count > 0,
    archived: Boolean(
      conv.participants?.find((p) => p.user_id)?.archived_at ??
        conv.participants?.some((p) => p.archived_at)
    ),
    conversationId: conv.id,
    actions: isBilling
      ? [{ label: 'Manage Subscription', href: '/account/settings', primary: true }]
      : isBroadcast && broadcastType === 'path'
        ? [{ label: 'Open Paths', href: '/paths', primary: true }]
        : [],
    readOnly: isBroadcast,
  }
}

function announcementToFeedItem(
  ann: { id: string; title: string; message: string; created_at: string; dismissed: boolean }
): FamilyFeedItem {
  return {
    id: `ann:${ann.id}`,
    type: 'announcement',
    title: `📢 ${ann.title}`,
    preview: ann.message,
    body: ann.message,
    date: ann.created_at,
    unread: !ann.dismissed,
    archived: false,
    announcementId: ann.id,
    actions: [],
    readOnly: true,
  }
}

export async function fetchFamilyFeed(
  userId: string,
  tab: FamilyFeedTab
): Promise<FamilyFeedItem[]> {
  const archived = tab === 'archived'
  const [convResult, announcements, children, subscription] = await Promise.all([
    fetchParentConversations(userId, { filter: archived ? 'archived' : 'inbox', page: 1, pageSize: 100 }),
    tab === 'announcements' ? fetchActiveAnnouncementsForParent(userId) : Promise.resolve([]),
    supabase.from('child_profiles').select('id, name, points, streak_days').eq('parent_id', userId),
    supabase.from('subscriptions').select('plan, status, end_date').eq('user_id', userId).maybeSingle(),
  ])

  const broadcastIds = (convResult.data ?? [])
    .map((c) => c.broadcast_id)
    .filter(Boolean) as string[]

  let broadcastMap: Record<string, { broadcast_type: BroadcastType }> = {}
  if (broadcastIds.length > 0) {
    const { data: broadcasts } = await supabase
      .from('broadcasts')
      .select('id, broadcast_type')
      .in('id', broadcastIds)
    broadcastMap = Object.fromEntries((broadcasts ?? []).map((b) => [b.id, b]))
  }

  const conversationItems = (convResult.data ?? []).map((conv) =>
    conversationToFeedItem(conv, conv.broadcast_id ? broadcastMap[conv.broadcast_id]?.broadcast_type : null)
  )

  const announcementConvItems =
    tab === 'announcements'
      ? (
          await fetchParentConversations(userId, { filter: 'announcements', page: 1, pageSize: 100 })
        ).data.map((conv) =>
          conversationToFeedItem(
            conv,
            conv.broadcast_id ? broadcastMap[conv.broadcast_id]?.broadcast_type : null
          )
        )
      : []

  const bannerItems =
    tab === 'announcements'
      ? announcements.filter((a) => !a.dismissed).map(announcementToFeedItem)
      : []

  const syntheticItems: FamilyFeedItem[] = []

  if (tab === 'inbox' && !archived) {
    const kids = children.data ?? []

    if (kids.length > 0) {
      const childIds = kids.map((k) => k.id)
      const childNameMap = Object.fromEntries(kids.map((k) => [k.id, k.name]))

      const [{ data: badges }, { data: certs }, { data: streaks }] = await Promise.all([
        supabase
          .from('child_badges')
          .select('child_profile_id, awarded_at, badge:badges(name, icon)')
          .in('child_profile_id', childIds)
          .order('awarded_at', { ascending: false })
          .limit(15),
        supabase
          .from('certificates')
          .select('*')
          .in('child_profile_id', childIds)
          .order('completed_at', { ascending: false })
          .limit(15),
        supabase.from('child_streaks').select('child_profile_id, current_streak').in('child_profile_id', childIds),
      ])

      for (const row of badges ?? []) {
        const childName = childNameMap[row.child_profile_id] ?? 'Your child'
        const badge = row.badge as { name?: string; icon?: string } | null
        const badgeName = badge?.name ?? 'Badge'
        const id = `badge:${row.child_profile_id}:${row.awarded_at}`
        if (isSyntheticFeedItemArchived(userId, id)) continue
        syntheticItems.push({
          id,
          type: 'achievement',
          title: `🏆 ${childName} earned a badge`,
          preview: badgeName,
          body: `${childName} earned:\n\n${badge?.icon ? `${badge.icon} ` : ''}${badgeName}`,
          date: row.awarded_at ?? new Date().toISOString(),
          unread: !isSyntheticFeedItemRead(userId, id),
          archived: false,
          childName,
          childProfileId: row.child_profile_id,
          actions: [{ label: 'View Badge', href: '/achievements', primary: true }],
          readOnly: true,
        })
      }

      for (const cert of certs ?? []) {
        const id = `cert:${cert.id}`
        if (isSyntheticFeedItemArchived(userId, id)) continue
        syntheticItems.push({
          id,
          type: 'certificate',
          title: '🎓 Certificate Unlocked',
          preview: `${cert.child_name} completed ${cert.path_name}`,
          body: `${cert.child_name} completed:\n\n${cert.path_name}\n\nLevel 1`,
          date: cert.completed_at,
          unread: !isSyntheticFeedItemRead(userId, id),
          archived: false,
          childName: cert.child_name,
          childProfileId: cert.child_profile_id,
          actions: [
            { label: 'View Certificate', href: '/certificates', primary: true },
            { label: 'Download PDF', href: '/certificates' },
          ],
          readOnly: true,
        })
      }

      const streakMap = Object.fromEntries((streaks ?? []).map((s) => [s.child_profile_id, s.current_streak]))
      for (const kid of kids) {
        const streak = streakMap[kid.id] ?? kid.streak_days ?? 0
        if (streak >= 7) {
          const id = `streak:${kid.id}:${streak}`
          if (isSyntheticFeedItemArchived(userId, id)) continue
          syntheticItems.push({
            id,
            type: 'achievement',
            title: `🔥 ${kid.name} reached a streak`,
            preview: `${streak}-Day Learning Streak`,
            body: `${kid.name} reached:\n\n${streak}-Day Learning Streak\n\nKeep the momentum going!`,
            date: new Date().toISOString(),
            unread: !isSyntheticFeedItemRead(userId, id),
            archived: false,
            childName: kid.name,
            childProfileId: kid.id,
            actions: [{ label: 'View Progress', href: '/parent/dashboard', primary: true }],
            readOnly: true,
          })
        }

        const points = kid.points ?? 0
        if (points >= 100) {
          const milestone = points >= 250 ? 250 : 100
          const id = `stars:${kid.id}:${milestone}`
          if (isSyntheticFeedItemArchived(userId, id)) continue
          syntheticItems.push({
            id,
            type: 'achievement',
            title: `⭐ ${kid.name} earned stars`,
            preview: `${milestone} Stars`,
            body: `${kid.name} earned:\n\n${milestone} Stars`,
            date: new Date().toISOString(),
            unread: !isSyntheticFeedItemRead(userId, id),
            archived: false,
            childName: kid.name,
            childProfileId: kid.id,
            actions: [{ label: 'View Rewards', href: '/discoverer/rewards', primary: true }],
            readOnly: true,
          })
        }
      }
    }

    const sub = subscription.data
    if (sub) {
      const isPremium =
        sub.status === 'active' && sub.plan && PAID_PLANS.includes(sub.plan as SubscriptionPlan)
      if (isPremium && sub.end_date) {
        const end = new Date(sub.end_date)
        const daysLeft = Math.ceil((end.getTime() - Date.now()) / 86400000)
        if (daysLeft > 0 && daysLeft <= 14) {
          const id = `sub:renew:${sub.end_date}`
          if (!isSyntheticFeedItemArchived(userId, id)) {
            syntheticItems.push({
              id,
              type: 'subscription',
              title: '💳 Subscription Reminder',
              preview: `Premium renews in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
              body: `Your Yaqza Kids premium plan renews in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.\n\nRenewal date: ${end.toLocaleDateString()}`,
              date: new Date().toISOString(),
              unread: !isSyntheticFeedItemRead(userId, id),
              archived: false,
              actions: [{ label: 'Manage Subscription', href: '/account/settings', primary: true }],
              readOnly: true,
            })
          }
        }
      } else if (sub.status === 'active' && sub.plan && sub.plan !== 'free') {
        const id = `sub:active:${sub.plan}`
        if (!isSyntheticFeedItemArchived(userId, id) && !isSyntheticFeedItemRead(userId, id)) {
          syntheticItems.push({
            id,
            type: 'subscription',
            title: '💳 Payment Successful',
            preview: 'Your subscription is active',
            body: 'Thank you! Your Yaqza Kids subscription is active and your family has full access.',
            date: new Date().toISOString(),
            unread: true,
            archived: false,
            actions: [{ label: 'Manage Subscription', href: '/account/settings', primary: true }],
            readOnly: true,
          })
        }
      }
    }
  }

  if (tab === 'archived') {
    const archivedSynthetic: FamilyFeedItem[] = []
    // Rebuild archived synthetic from storage is expensive; skip for archived tab (conversations only)
    return [...conversationItems.filter((c) => c.archived), ...archivedSynthetic].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }

  if (tab === 'announcements') {
    const merged = [...announcementConvItems, ...bannerItems]
    const seen = new Set<string>()
    return merged
      .filter((item) => {
        if (seen.has(item.id)) return false
        seen.add(item.id)
        return true
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  // inbox
  const inboxConversations = conversationItems.filter((c) => !c.archived && c.type !== 'announcement')
  return [...inboxConversations, ...syntheticItems].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}

export function searchFamilyFeed(items: FamilyFeedItem[], query: string): FamilyFeedItem[] {
  const q = query.trim().toLowerCase()
  if (!q) return items
  return items.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      item.preview.toLowerCase().includes(q) ||
      item.body.toLowerCase().includes(q)
  )
}

export function countUnreadInFeed(items: FamilyFeedItem[]): number {
  return items.filter((item) => item.unread && !item.archived).length
}

export async function fetchFamilyNotificationCount(userId: string): Promise<number> {
  const [inbox, announcements] = await Promise.all([
    fetchFamilyFeed(userId, 'inbox'),
    fetchFamilyFeed(userId, 'announcements'),
  ])
  return countUnreadInFeed(inbox) + countUnreadInFeed(announcements)
}

export async function openFamilyFeedItem(
  userId: string,
  item: FamilyFeedItem
): Promise<ConversationDetail | null> {
  if (item.conversationId) {
    const detail = await fetchConversationDetail(userId, item.conversationId)
    await markConversationRead(userId, item.conversationId)
    return detail
  }

  if (!item.readOnly) return null
  markSyntheticFeedItemRead(userId, item.id)
  return null
}

export async function markFamilyFeedItemUnread(userId: string, item: FamilyFeedItem): Promise<void> {
  if (item.conversationId) {
    await markConversationUnread(userId, item.conversationId)
    return
  }
  markSyntheticFeedItemUnread(userId, item.id)
}

export async function archiveFamilyFeedItem(userId: string, item: FamilyFeedItem): Promise<void> {
  if (item.conversationId) {
    await archiveConversation(userId, item.conversationId)
    return
  }
  archiveSyntheticFeedItem(userId, item.id)
}

export async function unarchiveFamilyFeedItem(userId: string, item: FamilyFeedItem): Promise<void> {
  if (item.conversationId) {
    await unarchiveConversation(userId, item.conversationId)
    return
  }
  unarchiveSyntheticFeedItem(userId, item.id)
}
