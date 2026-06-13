export interface AdminRoleRow {
  id: string
  user_id: string
  role: string
  created_at: string
}

export interface SupportTicket {
  id: string
  ticket_number?: string
  parent_id: string
  subject: string
  category?: string
  priority?: string
  message: string
  status: 'open' | 'pending_parent' | 'in_progress' | 'resolved' | 'closed' | string
  assigned_to?: string | null
  attachment_url?: string | null
  admin_reply: string | null
  admin_notes: string | null
  created_at: string
  updated_at: string
  parent?: { full_name: string; email: string | null } | null
  assignee?: { full_name: string; email: string | null } | null
  last_reply_at?: string | null
  /** @deprecated use parent */
  user?: { full_name: string; email: string | null } | null
}

export interface PlatformSetting {
  id: string
  key: string
  value: string
  created_at?: string
  updated_at?: string
}

export interface AdminActivityLogEntry {
  id: string
  admin_id: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  details: Record<string, unknown> | null
  created_at: string
  admin?: { full_name: string } | null
}

export interface AdminBadge {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  image_url: string | null
  condition_type: string | null
  condition_value: string | null
  created_at?: string
}

export interface AdminHeroCard {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  unlock_path_id: string | null
  sort_order: number
  trait: string | null
  era: string | null
  star_rating: number | null
  is_premium: boolean
  created_at?: string
}
