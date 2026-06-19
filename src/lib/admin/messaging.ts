import { supabase } from '@/lib/supabase'
import { logAdminAction } from '@/lib/admin/activity'
import type { AdminInboxFolder, AdminSendAudience, ConversationCategory } from '@/lib/messaging/constants'
import type {
  AdminFolderCounts,
  ConversationDetail,
  ConversationSummary,
  DirectMessageRow,
  FetchAdminConversationsOptions,
  PaginatedResult,
  ParentContext,
} from '@/lib/messaging/types'
import type { SubscriptionPlan } from '@/lib/types'

const PAID_PLANS: SubscriptionPlan[] = ['family_monthly', 'family_yearly', 'homeschool', 'school']

function planLabel(plan: SubscriptionPlan | null, status: string | null): string {
  if (status === 'active' && plan && PAID_PLANS.includes(plan)) {
    if (plan === 'family_monthly' || plan === 'family_yearly') return 'Premium'
    if (plan === 'homeschool') return 'Homeschool'
    if (plan === 'school') return 'School'
    return 'Premium'
  }
  if (status === 'trialing') return 'Trial'
  return 'Free'
}

async function fetchParentContexts(parentIds: string[]): Promise<Record<string, ParentContext>> {
  if (parentIds.length === 0) return {}

  const unique = [...new Set(parentIds)]
  const [{ data: profiles }, { data: children }, { data: subs }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email, created_at').in('id', unique),
    supabase.from('child_profiles').select('id, name, age_group, parent_id').in('parent_id', unique),
    supabase.from('subscriptions').select('user_id, plan, status').in('user_id', unique),
  ])

  const childrenByParent: Record<string, ParentContext['children']> = {}
  for (const child of children ?? []) {
    if (!childrenByParent[child.parent_id]) childrenByParent[child.parent_id] = []
    childrenByParent[child.parent_id].push({
      id: child.id,
      name: child.name,
      age_group: child.age_group,
    })
  }

  const subMap = Object.fromEntries((subs ?? []).map((s) => [s.user_id, s]))

  return Object.fromEntries(
    (profiles ?? []).map((p) => {
      const sub = subMap[p.id]
      return [
        p.id,
        {
          id: p.id,
          full_name: p.full_name ?? 'Parent',
          email: p.email ?? null,
          created_at: p.created_at ?? null,
          children: childrenByParent[p.id] ?? [],
          subscription: sub
            ? {
                plan: (sub.plan as SubscriptionPlan) ?? null,
                status: sub.status ?? null,
                label: planLabel((sub.plan as SubscriptionPlan) ?? null, sub.status ?? null),
              }
            : { plan: null, status: null, label: 'Free' },
        } satisfies ParentContext,
      ]
    })
  )
}

function computeAdminUnread(
  messages: DirectMessageRow[],
  adminId: string,
  adminLastRead: string | null
): number {
  return messages.filter(
    (m) =>
      m.sender_type === 'parent' &&
      m.sender_id !== adminId &&
      (!adminLastRead || m.created_at > adminLastRead)
  ).length
}

function matchesFolder(
  conv: ConversationSummary,
  folder: AdminInboxFolder,
  adminId: string
): boolean {
  const last = conv.last_message
  const adminParticipant = conv.participants?.find((p) => p.user_id === adminId)
  const status = conv.status ?? 'open'

  if (conv.broadcast_id) return false

  switch (folder) {
    case 'trash':
      return status === 'trashed' || Boolean(adminParticipant?.trashed_at)
    case 'archived':
      return status === 'archived' || Boolean(adminParticipant?.archived_at)
    case 'important':
      return conv.priority === 'important' && status !== 'trashed'
    case 'todo':
      return Boolean(conv.is_todo) && status !== 'trashed'
    case 'scheduled':
      return Boolean(last?.scheduled_for && last.scheduled_for > new Date().toISOString())
    case 'sent':
      return (
        status !== 'trashed' &&
        status !== 'archived' &&
        !adminParticipant?.archived_at &&
        !adminParticipant?.trashed_at &&
        last?.sender_type === 'admin'
      )
    case 'inbox':
    default:
      return (
        status !== 'trashed' &&
        status !== 'archived' &&
        !adminParticipant?.archived_at &&
        !adminParticipant?.trashed_at &&
        (last?.sender_type === 'parent' || (conv.unread_count ?? 0) > 0 || !last)
      )
  }
}

async function enrichAdminConversations(
  conversations: ConversationSummary[],
  adminId: string
): Promise<ConversationSummary[]> {
  const ids = conversations.map((c) => c.id)
  if (ids.length === 0) return []

  const [{ data: messages }, { data: participants }] = await Promise.all([
    supabase.from('messages').select('*').in('conversation_id', ids).order('created_at', { ascending: false }),
    supabase.from('conversation_participants').select('*').in('conversation_id', ids),
  ])

  const parentIds = [
    ...new Set(
      conversations
        .map((c) => c.parent_user_id)
        .filter(Boolean)
        .concat(
          (participants ?? []).filter((p) => p.user_type === 'parent').map((p) => p.user_id)
        ) as string[]
    ),
  ]

  const parentMap = await fetchParentContexts(parentIds)
  const profileMap = Object.fromEntries(Object.values(parentMap).map((p) => [p.id, p]))

  const lastMessageMap: Record<string, DirectMessageRow> = {}
  const messagesByConv: Record<string, DirectMessageRow[]> = {}
  for (const msg of messages ?? []) {
    if (!lastMessageMap[msg.conversation_id]) lastMessageMap[msg.conversation_id] = msg
    if (!messagesByConv[msg.conversation_id]) messagesByConv[msg.conversation_id] = []
    messagesByConv[msg.conversation_id].push(msg)
  }

  return conversations.map((conv) => {
    const parts = (participants ?? [])
      .filter((p) => p.conversation_id === conv.id)
      .map((p) => ({
        ...p,
        profile: profileMap[p.user_id]
          ? { full_name: profileMap[p.user_id].full_name, email: profileMap[p.user_id].email }
          : null,
      }))

    const adminPart = parts.find((p) => p.user_id === adminId)
    const parentId =
      conv.parent_user_id ?? parts.find((p) => p.user_type === 'parent')?.user_id ?? null
    const unread = computeAdminUnread(
      messagesByConv[conv.id] ?? [],
      adminId,
      adminPart?.last_read_at ?? null
    )

    return {
      ...conv,
      last_message: lastMessageMap[conv.id] ?? null,
      unread_count: unread,
      participants: parts,
      parent: parentId ? parentMap[parentId] ?? null : null,
    }
  })
}

export async function fetchAdminFolderCounts(adminId: string): Promise<AdminFolderCounts> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .is('broadcast_id', null)
    .order('updated_at', { ascending: false })
    .limit(500)

  if (error) throw error

  const enriched = await enrichAdminConversations((data ?? []) as ConversationSummary[], adminId)
  const counts: AdminFolderCounts = {
    inbox: 0,
    sent: 0,
    important: 0,
    todo: 0,
    scheduled: 0,
    archived: 0,
    trash: 0,
  }

  for (const conv of enriched) {
    for (const folder of Object.keys(counts) as AdminInboxFolder[]) {
      if (matchesFolder(conv, folder, adminId)) counts[folder]++
    }
  }

  return counts
}

export async function fetchAdminConversations(
  options: FetchAdminConversationsOptions = {}
): Promise<PaginatedResult<ConversationSummary>> {
  const page = options.page ?? 1
  const pageSize = options.pageSize ?? 30
  const folder = options.folder ?? 'inbox'
  const adminId = options.adminId

  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('*')
    .is('broadcast_id', null)
    .order('updated_at', { ascending: false })
    .limit(500)

  if (error) throw error

  let enriched = await enrichAdminConversations(
    (conversations ?? []) as ConversationSummary[],
    adminId ?? ''
  )

  if (adminId) {
    enriched = enriched.filter((c) => matchesFolder(c, folder, adminId))
  }

  if (options.search?.trim()) {
    const q = options.search.trim().toLowerCase()
    enriched = enriched.filter((c) => {
      const parent = c.parent
      const childMatch = parent?.children.some((ch) => ch.name.toLowerCase().includes(q))
      return (
        c.subject.toLowerCase().includes(q) ||
        c.last_message?.message.toLowerCase().includes(q) ||
        parent?.full_name.toLowerCase().includes(q) ||
        parent?.email?.toLowerCase().includes(q) ||
        childMatch
      )
    })
  }

  const total = enriched.length
  const from = (page - 1) * pageSize
  const data = enriched.slice(from, from + pageSize)

  return { data, total, page, pageSize }
}

export async function fetchAdminConversationDetail(conversationId: string): Promise<ConversationDetail> {
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

  const parentId =
    conversation.parent_user_id ??
    (participants ?? []).find((p) => p.user_type === 'parent')?.user_id ??
    null

  const parentMap = parentId ? await fetchParentContexts([parentId]) : {}
  const userIds = [...new Set((participants ?? []).map((p) => p.user_id))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000'])

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]))

  return {
    ...conversation,
    messages: messages ?? [],
    participants: (participants ?? []).map((p) => ({
      ...p,
      profile: profileMap[p.user_id] ?? null,
    })),
    parent: parentId ? parentMap[parentId] ?? null : null,
  }
}

export async function sendAdminReply(
  adminId: string,
  conversationId: string,
  message: string,
  recipientUserId?: string | null
): Promise<void> {
  const { error } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: adminId,
    sender_type: 'admin',
    message: message.trim(),
    recipient_user_id: recipientUserId ?? null,
    delivered_at: new Date().toISOString(),
  })

  if (error) throw error
  await logAdminAction('message_sent', 'conversation', conversationId)
}

export async function markAdminConversationRead(
  adminId: string,
  conversationId: string
): Promise<void> {
  const { error } = await supabase
    .from('conversation_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', adminId)

  if (error) {
    await supabase.from('conversation_participants').upsert({
      conversation_id: conversationId,
      user_id: adminId,
      user_type: 'admin',
      last_read_at: new Date().toISOString(),
    })
  }
}

export async function updateAdminConversation(
  conversationId: string,
  patch: {
    status?: string
    priority?: string
    is_todo?: boolean
    category?: ConversationCategory
    assigned_admin_id?: string | null
    internal_notes?: string | null
  }
): Promise<void> {
  const { error } = await supabase.from('conversations').update(patch).eq('id', conversationId)
  if (error) throw error
}

export async function setAdminConversationFolder(
  adminId: string,
  conversationId: string,
  action: 'archive' | 'unarchive' | 'trash' | 'restore' | 'important' | 'unimportant' | 'todo' | 'untodo'
): Promise<void> {
  if (action === 'important' || action === 'unimportant') {
    await updateAdminConversation(conversationId, {
      priority: action === 'important' ? 'important' : 'normal',
    })
    return
  }

  if (action === 'todo' || action === 'untodo') {
    await updateAdminConversation(conversationId, { is_todo: action === 'todo' })
    return
  }

  if (action === 'archive') {
    await supabase
      .from('conversations')
      .update({ status: 'archived' })
      .eq('id', conversationId)
    await supabase
      .from('conversation_participants')
      .update({ archived_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', adminId)
    return
  }

  if (action === 'unarchive') {
    await supabase.from('conversations').update({ status: 'open' }).eq('id', conversationId)
    await supabase
      .from('conversation_participants')
      .update({ archived_at: null })
      .eq('conversation_id', conversationId)
      .eq('user_id', adminId)
    return
  }

  if (action === 'trash') {
    await supabase.from('conversations').update({ status: 'trashed' }).eq('id', conversationId)
    await supabase
      .from('conversation_participants')
      .update({ trashed_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', adminId)
    return
  }

  if (action === 'restore') {
    await supabase.from('conversations').update({ status: 'open' }).eq('id', conversationId)
    await supabase
      .from('conversation_participants')
      .update({ trashed_at: null, archived_at: null })
      .eq('conversation_id', conversationId)
      .eq('user_id', adminId)
  }
}

export async function resolveRecipientIds(audience: AdminSendAudience, selectedIds: string[] = []): Promise<string[]> {
  if (audience === 'one' || audience === 'multiple') {
    return selectedIds
  }

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, created_at, suspended')
    .eq('role', 'parent')

  if (profileError) throw profileError

  const { data: subs, error: subError } = await supabase.from('subscriptions').select('user_id, plan, status')
  if (subError) throw subError

  const subMap = Object.fromEntries((subs ?? []).map((s) => [s.user_id, s]))

  const { data: trialSetting } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'free_trial_days')
    .maybeSingle()

  const trialDays = Number(trialSetting?.value ?? 14)
  const now = Date.now()

  return (profiles ?? [])
    .filter((p) => {
      if (p.suspended) return false
      const sub = subMap[p.id]
      const isPremium = sub?.status === 'active' && sub.plan && PAID_PLANS.includes(sub.plan as SubscriptionPlan)
      const isFree = !isPremium
      const inTrial =
        isFree &&
        p.created_at &&
        now - new Date(p.created_at).getTime() < trialDays * 86400000
      const isInactive =
        !sub ||
        sub.status === 'cancelled' ||
        sub.status === 'expired' ||
        (isFree && !inTrial)

      if (audience === 'all') return true
      if (audience === 'premium') return isPremium
      if (audience === 'trial') return inTrial
      if (audience === 'inactive') return isInactive
      return false
    })
    .map((p) => p.id)
}

export async function adminCreateConversation(
  adminId: string,
  subject: string,
  message: string,
  recipientIds: string[],
  options: { childProfileId?: string | null; category?: ConversationCategory } = {}
): Promise<string> {
  if (recipientIds.length === 0) throw new Error('Select at least one recipient')

  const { data, error } = await supabase.rpc('admin_create_conversation', {
    p_subject: subject.trim(),
    p_message: message.trim(),
    p_recipient_ids: recipientIds,
    p_sender_id: adminId,
    p_child_profile_id: options.childProfileId ?? null,
    p_category: options.category ?? 'general',
  })

  if (error) throw error
  await logAdminAction('conversation_created', 'conversation', data as string, {
    recipient_count: recipientIds.length,
  })
  return data as string
}

export async function fetchParentsForSelect(search?: string) {
  let query = supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'parent')
    .order('full_name')

  if (search?.trim()) {
    const term = search.trim()
    query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%`)
  }

  const { data, error } = await query.limit(50)
  if (error) throw error
  return data ?? []
}

export async function fetchChildrenForParent(parentId: string) {
  const { data, error } = await supabase
    .from('child_profiles')
    .select('id, name, age_group')
    .eq('parent_id', parentId)
    .order('name')

  if (error) throw error
  return data ?? []
}

export async function searchParentsForMessage(query: string) {
  return fetchParentsForSelect(query)
}
