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
  const isTrashed = status === 'trashed' || Boolean(adminParticipant?.trashed_at)
  const isArchived = status === 'archived' || Boolean(adminParticipant?.archived_at)

  if (conv.broadcast_id) return false

  switch (folder) {
    case 'trash':
      return isTrashed
    case 'archived':
      return isArchived && !isTrashed
    case 'important':
      return conv.priority === 'important' && !isTrashed
    case 'todo':
      return Boolean(conv.is_todo) && !isTrashed
    case 'scheduled':
      return Boolean(last?.scheduled_for && last.scheduled_for > new Date().toISOString()) && !isTrashed
    case 'sent':
      return (
        !isTrashed &&
        !isArchived &&
        last?.sender_type === 'admin'
      )
    case 'inbox':
    default:
      return (
        !isTrashed &&
        !isArchived &&
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
  if (recipientUserId) {
    await ensureParentParticipant(conversationId, recipientUserId)
  }

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

/** Guarantee the parent has a participant row (admin RPC can skip on conflict). */
export async function ensureParentParticipant(
  conversationId: string,
  parentUserId: string
): Promise<void> {
  const { data: existing } = await supabase
    .from('conversation_participants')
    .select('id, user_type')
    .eq('conversation_id', conversationId)
    .eq('user_id', parentUserId)
    .maybeSingle()

  if (existing?.user_type === 'parent') return

  const { error } = await supabase.from('conversation_participants').upsert(
    {
      conversation_id: conversationId,
      user_id: parentUserId,
      user_type: 'parent',
    },
    { onConflict: 'conversation_id,user_id' }
  )

  if (error) {
    throw new Error(`Could not add parent to conversation: ${error.message}`)
  }
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
  const { error: rpcError } = await supabase.rpc('admin_set_conversation_folder', {
    p_conversation_id: conversationId,
    p_action: action,
    p_admin_id: adminId,
  })

  if (!rpcError) return

  if (rpcError.code !== 'PGRST202') {
    throw rpcError
  }

  // Fallback before migration 034 is applied
  await ensureAdminParticipant(conversationId, adminId)

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

  const participantPatch: Record<string, string | null> = {}
  let statusPatch: string | undefined

  if (action === 'archive') {
    statusPatch = 'archived'
    participantPatch.archived_at = new Date().toISOString()
    participantPatch.trashed_at = null
  } else if (action === 'unarchive') {
    statusPatch = 'open'
    participantPatch.archived_at = null
  } else if (action === 'trash') {
    statusPatch = 'trashed'
    participantPatch.trashed_at = new Date().toISOString()
    participantPatch.archived_at = null
  } else if (action === 'restore') {
    statusPatch = 'open'
    participantPatch.trashed_at = null
    participantPatch.archived_at = null
  }

  if (statusPatch) {
    const { error: statusError } = await supabase
      .from('conversations')
      .update({ status: statusPatch })
      .eq('id', conversationId)

    if (!statusError) {
      // Status column is enough for inbox folders when RPC / trashed_at are unavailable.
      return
    }

    if (!statusError.message.includes('column')) {
      throw statusError
    }
  }

  const participantPatchKeys = Object.keys(participantPatch)
  if (participantPatchKeys.length === 0) {
    throw new Error(
      'Trash requires a database update. In Supabase SQL Editor, run supabase/apply_messaging_inbox_v2.sql then supabase/apply_admin_conversation_folders.sql.'
    )
  }

  const { error: participantError } = await supabase
    .from('conversation_participants')
    .update(participantPatch)
    .eq('conversation_id', conversationId)
    .eq('user_id', adminId)

  if (participantError) {
    throw new Error(
      participantError.message.includes('trashed_at')
        ? 'Trash requires a database update. In Supabase SQL Editor, run supabase/apply_messaging_inbox_v2.sql then supabase/apply_admin_conversation_folders.sql.'
        : participantError.message
    )
  }
}

async function ensureAdminParticipant(conversationId: string, adminId: string): Promise<void> {
  const { error } = await supabase.from('conversation_participants').upsert(
    {
      conversation_id: conversationId,
      user_id: adminId,
      user_type: 'admin',
    },
    { onConflict: 'conversation_id,user_id' }
  )
  if (error) throw error
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

  let firstConversationId: string | null = null

  // One RPC call per parent — works with both old and new DB functions
  for (const recipientId of recipientIds) {
    const baseArgs = {
      p_subject: subject.trim(),
      p_message: message.trim(),
      p_recipient_ids: [recipientId],
      p_sender_id: adminId,
    }

    let { data, error } = await supabase.rpc('admin_create_conversation', {
      ...baseArgs,
      p_child_profile_id: options.childProfileId ?? null,
      p_category: options.category ?? 'general',
    })

    // Production may still have the 4-parameter function until migration 032 is applied
    if (error?.code === 'PGRST202') {
      ;({ data, error } = await supabase.rpc('admin_create_conversation', baseArgs))
    }

    if (error) throw error

    const conversationId = data as string
    if (!firstConversationId) firstConversationId = conversationId

    await ensureParentParticipant(conversationId, recipientId)
    const { error: patchConvError } = await supabase
      .from('conversations')
      .update({
        parent_user_id: recipientId,
        child_profile_id: options.childProfileId ?? null,
        category: options.category ?? 'general',
        last_message_at: new Date().toISOString(),
      })
      .eq('id', conversationId)

    if (patchConvError) {
      console.warn('Conversation metadata patch skipped:', patchConvError.message)
    }

    const { error: patchMsgError } = await supabase
      .from('messages')
      .update({ recipient_user_id: recipientId })
      .eq('conversation_id', conversationId)
      .eq('sender_id', adminId)

    if (patchMsgError) {
      console.warn('Message recipient patch skipped:', patchMsgError.message)
    }
  }

  await logAdminAction('conversation_created', 'conversation', firstConversationId!, {
    recipient_count: recipientIds.length,
  })
  return firstConversationId!
}

export async function fetchParentsForSelect(search?: string) {
  const { data: childRows, error: childError } = await supabase
    .from('child_profiles')
    .select('parent_id, name')

  if (childError) throw childError

  const parentIds = [...new Set((childRows ?? []).map((c) => c.parent_id))]
  if (parentIds.length === 0) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'parent')
      .order('full_name')
      .limit(50)
    if (error) throw error
    return data ?? []
  }

  const childrenByParent: Record<string, string[]> = {}
  for (const row of childRows ?? []) {
    if (!childrenByParent[row.parent_id]) childrenByParent[row.parent_id] = []
    childrenByParent[row.parent_id].push(row.name)
  }

  let query = supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', parentIds)
    .order('full_name')

  if (search?.trim()) {
    const term = search.trim()
    query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%`)
  }

  const { data, error } = await query.limit(50)
  if (error) throw error

  return (data ?? []).map((p) => ({
    ...p,
    child_names: childrenByParent[p.id] ?? [],
  }))
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
