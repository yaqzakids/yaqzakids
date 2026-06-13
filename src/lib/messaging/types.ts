import type {
  AnnouncementAudience,
  BroadcastAudience,
  BroadcastType,
  InboxFilter,
  MessageDeliveryStatus,
} from '@/lib/messaging/constants'

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export interface ConversationRow {
  id: string
  subject: string
  created_by: string
  created_at: string
  updated_at: string
  broadcast_id?: string | null
}

export interface BroadcastRow {
  id: string
  broadcast_type: BroadcastType
  title: string
  message: string
  audience: BroadcastAudience
  status: 'draft' | 'sent'
  created_by: string
  sent_at: string | null
  created_at: string
  updated_at: string
}

export interface ConversationParticipantRow {
  id: string
  conversation_id: string
  user_id: string
  user_type: 'parent' | 'admin'
  last_read_at: string | null
  archived_at: string | null
  created_at: string
  profile?: { full_name: string; email: string | null } | null
}

export interface DirectMessageRow {
  id: string
  conversation_id: string
  sender_id: string | null
  sender_type: 'parent' | 'admin'
  message: string
  attachment_url: string | null
  created_at: string
}

export interface ConversationSummary extends ConversationRow {
  last_message?: DirectMessageRow | null
  unread_count: number
  participants?: ConversationParticipantRow[]
}

export interface ConversationDetail extends ConversationRow {
  messages: DirectMessageRow[]
  participants: ConversationParticipantRow[]
}

export interface AnnouncementRow {
  id: string
  title: string
  message: string
  audience: AnnouncementAudience
  created_by: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AnnouncementWithDismissed extends AnnouncementRow {
  dismissed: boolean
}

export interface MessageWithStatus extends DirectMessageRow {
  delivery_status?: MessageDeliveryStatus | null
}

export interface FetchConversationsOptions {
  filter?: InboxFilter
  page?: number
  pageSize?: number
}
