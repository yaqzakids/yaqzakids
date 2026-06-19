import { supabase } from '@/lib/supabase'
import { MESSAGE_ATTACHMENT_BUCKET } from '@/lib/messaging/constants'
import type {
  AnnouncementWithDismissed,
  ConversationDetail,
  ConversationSummary,
  DirectMessageRow,
  FetchConversationsOptions,
  PaginatedResult,
} from '@/lib/messaging/types'
import type { SubscriptionPlan } from '@/lib/types'

const PAID_PLANS: SubscriptionPlan[] = ['family_monthly', 'family_yearly', 'homeschool', 'school']

export async function fetchUnreadMessageCount(userId?: string): Promise<number> {
  const { data, error } = await supabase.rpc('get_unread_message_count', {
    p_user_id: userId ?? undefined,
  })
  if (error) {
    console.warn('Unread count failed:', error.message)
    return 0
  }
  return typeof data === 'number' ? data : 0
}

export async function fetchParentConversations(
  userId: string,
  options: FetchConversationsOptions = {}
): Promise<PaginatedResult<ConversationSummary>> {
  const page = options.page ?? 1
  const pageSize = options.pageSize ?? 15

  let participantQuery = supabase
    .from('conversation_participants')
    .select('conversation_id, last_read_at, archived_at')
    .eq('user_id', userId)

  if (options.filter === 'archived') {
    participantQuery = participantQuery.not('archived_at', 'is', null)
  } else {
    participantQuery = participantQuery.is('archived_at', null)
  }

  const { data: memberships, error: memberError } = await participantQuery
  if (memberError) throw memberError

  const conversationIds = (memberships ?? []).map((m) => m.conversation_id)
  if (conversationIds.length === 0) {
    return { data: [], total: 0, page, pageSize }
  }

  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('*', { count: 'exact' })
    .in('id', conversationIds)
    .order('updated_at', { ascending: false })

  if (error) throw error

  let convList = conversations ?? []
  if (options.filter === 'announcements') {
    convList = convList.filter((c) => c.broadcast_id)
  } else if (options.filter === 'inbox' || options.filter === 'unread') {
    convList = convList.filter((c) => !c.broadcast_id)
  }

  const from = (page - 1) * pageSize
  const paged = convList.slice(from, from + pageSize)

  const summaries = await enrichConversations(paged, userId, memberships ?? [])

  let filtered = summaries
  if (options.filter === 'unread') {
    filtered = summaries.filter((c) => c.unread_count > 0)
  }

  return {
    data: filtered,
    total: options.filter === 'unread' ? filtered.length : convList.length,
    page,
    pageSize,
  }
}

async function enrichConversations(
  conversations: { id: string; subject: string; created_by: string; created_at: string; updated_at: string }[],
  userId: string,
  memberships: { conversation_id: string; last_read_at: string | null; archived_at: string | null }[]
): Promise<ConversationSummary[]> {
  const ids = conversations.map((c) => c.id)
  if (ids.length === 0) return []

  const membershipMap = Object.fromEntries(memberships.map((m) => [m.conversation_id, m]))

  const [{ data: messages }, { data: participants }] = await Promise.all([
    supabase
      .from('messages')
      .select('*')
      .in('conversation_id', ids)
      .order('created_at', { ascending: false }),
    supabase.from('conversation_participants').select('*').in('conversation_id', ids),
  ])

  const lastMessageMap: Record<string, DirectMessageRow> = {}
  for (const msg of messages ?? []) {
    if (!lastMessageMap[msg.conversation_id]) {
      lastMessageMap[msg.conversation_id] = msg
    }
  }

  return conversations.map((conv) => {
    const membership = membershipMap[conv.id]
    const lastRead = membership?.last_read_at ?? null
    const unread = (messages ?? []).filter(
      (m) =>
        m.conversation_id === conv.id &&
        m.sender_id !== userId &&
        (!lastRead || m.created_at > lastRead)
    ).length

    return {
      ...conv,
      last_message: lastMessageMap[conv.id] ?? null,
      unread_count: unread,
      participants: (participants ?? []).filter((p) => p.conversation_id === conv.id),
    }
  })
}

export async function fetchConversationDetail(
  userId: string,
  conversationId: string
): Promise<ConversationDetail> {
  const { data: conversation, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .maybeSingle()

  if (error) throw error
  if (!conversation) throw new Error('Conversation not found')

  const [{ data: messages, error: msgError }, { data: participants, error: partError }] =
    await Promise.all([
      supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true }),
      supabase.from('conversation_participants').select('*').eq('conversation_id', conversationId),
    ])

  if (msgError) throw msgError
  if (partError) throw partError

  const isMember = (participants ?? []).some((p) => p.user_id === userId)
  if (!isMember) throw new Error('Conversation not found')

  const participantIds = [...new Set((participants ?? []).map((p) => p.user_id))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', participantIds)

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]))

  return {
    ...conversation,
    messages: messages ?? [],
    participants: (participants ?? []).map((p) => ({
      ...p,
      profile: profileMap[p.user_id] ?? null,
    })),
  }
}

export async function markConversationRead(userId: string, conversationId: string): Promise<void> {
  const { error } = await supabase
    .from('conversation_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)

  if (error) throw error
}

export async function archiveConversation(userId: string, conversationId: string): Promise<void> {
  const { error } = await supabase
    .from('conversation_participants')
    .update({ archived_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)

  if (error) throw error
}

export async function unarchiveConversation(userId: string, conversationId: string): Promise<void> {
  const { error } = await supabase
    .from('conversation_participants')
    .update({ archived_at: null })
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)

  if (error) throw error
}

export async function markConversationUnread(userId: string, conversationId: string): Promise<void> {
  const { error } = await supabase
    .from('conversation_participants')
    .update({ last_read_at: null })
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)

  if (error) throw error
}

export async function sendParentReply(
  userId: string,
  conversationId: string,
  message: string,
  attachmentUrl?: string | null
): Promise<void> {
  const { error } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: userId,
    sender_type: 'parent',
    message: message.trim(),
    attachment_url: attachmentUrl ?? null,
  })

  if (error) throw error
}

export async function uploadMessageAttachment(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.replace(/[^a-z0-9]/gi, '') || 'bin'
  const path = `${userId}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage.from(MESSAGE_ATTACHMENT_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  })

  if (error) throw error
  return path
}

export async function getMessageAttachmentUrl(storagePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(MESSAGE_ATTACHMENT_BUCKET)
    .createSignedUrl(storagePath, 3600)

  if (error) return null
  return data.signedUrl
}

export async function fetchActiveAnnouncementsForParent(
  userId: string
): Promise<AnnouncementWithDismissed[]> {
  const [{ data: profile }, { data: subscription }, { data: announcements }, { data: dismissals }] =
    await Promise.all([
      supabase.from('profiles').select('id, created_at').eq('id', userId).maybeSingle(),
      supabase.from('subscriptions').select('plan, status').eq('user_id', userId).maybeSingle(),
      supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
      supabase.from('announcement_dismissals').select('announcement_id').eq('user_id', userId),
    ])

  const dismissedSet = new Set((dismissals ?? []).map((d) => d.announcement_id))
  const isPremium =
    subscription?.status === 'active' && subscription.plan && PAID_PLANS.includes(subscription.plan as SubscriptionPlan)
  const isFree = !isPremium

  const { data: trialSetting } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'free_trial_days')
    .maybeSingle()

  const trialDays = Number(trialSetting?.value ?? 14)
  const createdAt = profile?.created_at ? new Date(profile.created_at).getTime() : 0
  const inTrial = isFree && createdAt > 0 && Date.now() - createdAt < trialDays * 86400000

  return (announcements ?? [])
    .filter((a) => {
      if (a.audience === 'everyone') return true
      if (a.audience === 'premium') return isPremium
      if (a.audience === 'free') return isFree || inTrial
      return true
    })
    .map((a) => ({
      ...a,
      dismissed: dismissedSet.has(a.id),
    }))
}

export async function dismissAnnouncement(userId: string, announcementId: string): Promise<void> {
  const { error } = await supabase.from('announcement_dismissals').upsert({
    announcement_id: announcementId,
    user_id: userId,
    dismissed_at: new Date().toISOString(),
  })

  if (error) throw error
}
