import { supabase } from '@/lib/supabase'
import { logAdminAction } from '@/lib/admin/activity'
import type { AdminSendAudience } from '@/lib/messaging/constants'
import type { ConversationDetail, ConversationSummary, DirectMessageRow, PaginatedResult } from '@/lib/messaging/types'
import type { SubscriptionPlan } from '@/lib/types'

const PAID_PLANS: SubscriptionPlan[] = ['family_monthly', 'family_yearly', 'homeschool', 'school']

export async function fetchAdminConversations(
  options: { search?: string; page?: number; pageSize?: number } = {}
): Promise<PaginatedResult<ConversationSummary>> {
  const page = options.page ?? 1
  const pageSize = options.pageSize ?? 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('conversations')
    .select('*', { count: 'exact' })
    .is('broadcast_id', null)
    .order('updated_at', { ascending: false })
    .range(from, to)

  if (options.search?.trim()) {
    const term = `%${options.search.trim()}%`
    query = query.ilike('subject', term)
  }

  const { data: conversations, error, count } = await query
  if (error) throw error

  let convs = conversations ?? []

  if (options.search?.trim() && convs.length < pageSize) {
    const { data: messageMatches } = await supabase
      .from('messages')
      .select('conversation_id')
      .ilike('message', `%${options.search.trim()}%`)

    const extraIds = [...new Set((messageMatches ?? []).map((m) => m.conversation_id))]
    if (extraIds.length > 0) {
      const { data: extraConvs } = await supabase
        .from('conversations')
        .select('*')
        .in('id', extraIds)
        .order('updated_at', { ascending: false })

      const seen = new Set(convs.map((c) => c.id))
      for (const c of extraConvs ?? []) {
        if (!seen.has(c.id)) convs.push(c)
      }
      convs.sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    }
  }

  const ids = convs.map((c) => c.id)
  if (ids.length === 0) return { data: [], total: 0, page, pageSize }

  const [{ data: messages }, { data: participants }] = await Promise.all([
    supabase.from('messages').select('*').in('conversation_id', ids).order('created_at', { ascending: false }),
    supabase.from('conversation_participants').select('*').in('conversation_id', ids),
  ])

  const parentIds = [...new Set((participants ?? []).filter((p) => p.user_type === 'parent').map((p) => p.user_id))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', parentIds.length > 0 ? parentIds : ['00000000-0000-0000-0000-000000000000'])

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]))

  const lastMessageMap: Record<string, DirectMessageRow> = {}
  for (const msg of messages ?? []) {
    if (!lastMessageMap[msg.conversation_id]) lastMessageMap[msg.conversation_id] = msg
  }

  const data: ConversationSummary[] = convs.map((conv) => ({
    ...conv,
    last_message: lastMessageMap[conv.id] ?? null,
    unread_count: 0,
    participants: (participants ?? [])
      .filter((p) => p.conversation_id === conv.id)
      .map((p) => ({ ...p, profile: profileMap[p.user_id] ?? null })),
  }))

  if (options.search?.trim()) {
    const q = options.search.trim().toLowerCase()
    const filtered = data.filter((c) => {
      const parentMatch = c.participants?.some(
        (p) =>
          p.profile?.full_name?.toLowerCase().includes(q) ||
          p.profile?.email?.toLowerCase().includes(q)
      )
      const subjectMatch = c.subject.toLowerCase().includes(q)
      const messageMatch = c.last_message?.message.toLowerCase().includes(q)
      return parentMatch || subjectMatch || messageMatch
    })
    return { data: filtered, total: filtered.length, page, pageSize }
  }

  return { data, total: count ?? data.length, page, pageSize }
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
  }
}

export async function sendAdminReply(
  adminId: string,
  conversationId: string,
  message: string
): Promise<void> {
  const { error } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: adminId,
    sender_type: 'admin',
    message: message.trim(),
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
  recipientIds: string[]
): Promise<string> {
  if (recipientIds.length === 0) throw new Error('Select at least one recipient')

  const { data, error } = await supabase.rpc('admin_create_conversation', {
    p_subject: subject.trim(),
    p_message: message.trim(),
    p_recipient_ids: recipientIds,
    p_sender_id: adminId,
  })

  if (error) throw error
  await logAdminAction('conversation_created', 'conversation', data as string, {
    recipient_count: recipientIds.length,
  })
  return data as string
}

export async function fetchParentsForSelect() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'parent')
    .order('full_name')

  if (error) throw error
  return data ?? []
}
