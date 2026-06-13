export const MESSAGE_ATTACHMENT_BUCKET = 'message-attachments'
export const MESSAGE_MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024
export const MESSAGE_ALLOWED_ATTACHMENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
]

export const INBOX_FILTERS = [
  { value: 'inbox', label: 'Inbox' },
  { value: 'unread', label: 'Unread' },
  { value: 'archived', label: 'Archived' },
] as const

export type InboxFilter = (typeof INBOX_FILTERS)[number]['value']

export const ADMIN_SEND_AUDIENCES = [
  { value: 'one', label: 'One parent' },
  { value: 'multiple', label: 'Multiple parents' },
  { value: 'all', label: 'All parents' },
  { value: 'premium', label: 'Premium families' },
  { value: 'trial', label: 'Trial families' },
  { value: 'inactive', label: 'Inactive families' },
] as const

export type AdminSendAudience = (typeof ADMIN_SEND_AUDIENCES)[number]['value']

export const ANNOUNCEMENT_AUDIENCES = [
  { value: 'everyone', label: 'Everyone' },
  { value: 'premium', label: 'Premium families' },
  { value: 'free', label: 'Free families' },
] as const

export type AnnouncementAudience = (typeof ANNOUNCEMENT_AUDIENCES)[number]['value']

export const BROADCAST_TYPES = [
  {
    value: 'feature',
    label: 'New Feature Announcement',
    icon: '✨',
    presetTitle: 'New Feature Announcement',
    presetMessage: 'We are excited to share a new feature with your family on Yaqza Kids!',
  },
  {
    value: 'path',
    label: 'New Path Released',
    icon: '🗺️',
    presetTitle: 'New Adventure Path Available',
    presetMessage: 'A brand-new learning path is now live. Explore it with your children today!',
  },
  {
    value: 'eid',
    label: 'Eid Greeting',
    icon: '🌙',
    presetTitle: 'Eid Mubarak from Yaqza Kids',
    presetMessage: 'Wishing you and your family a blessed Eid filled with joy and learning.',
  },
  {
    value: 'maintenance',
    label: 'Maintenance Notice',
    icon: '🔧',
    presetTitle: 'Scheduled Maintenance',
    presetMessage: 'Yaqza Kids will be briefly unavailable for scheduled maintenance. We apologize for any inconvenience.',
  },
  {
    value: 'subscription',
    label: 'Subscription Reminder',
    icon: '💳',
    presetTitle: 'Subscription Reminder',
    presetMessage: 'This is a friendly reminder about your Yaqza Kids subscription. Visit your dashboard to review your plan.',
  },
] as const

export type BroadcastType = (typeof BROADCAST_TYPES)[number]['value']

export const BROADCAST_AUDIENCES = [
  { value: 'all', label: 'All families' },
  { value: 'free', label: 'Free families' },
  { value: 'premium', label: 'Premium families' },
  { value: 'trial', label: 'Trial families' },
  { value: 'inactive', label: 'Inactive families' },
] as const

export type BroadcastAudience = (typeof BROADCAST_AUDIENCES)[number]['value']

export function broadcastTypeLabel(type: BroadcastType): string {
  return BROADCAST_TYPES.find((t) => t.value === type)?.label ?? type
}

export type MessageDeliveryStatus = 'sent' | 'delivered' | 'read'

export function getMessageStatus(
  messageCreatedAt: string,
  senderId: string,
  currentUserId: string,
  otherParticipantsLastRead: (string | null)[]
): MessageDeliveryStatus | null {
  if (senderId !== currentUserId) return null
  const allRead = otherParticipantsLastRead.every(
    (lastRead) => lastRead && lastRead >= messageCreatedAt
  )
  if (allRead && otherParticipantsLastRead.length > 0) return 'read'
  return 'delivered'
}

export function statusLabel(status: MessageDeliveryStatus): string {
  if (status === 'read') return 'Read'
  if (status === 'delivered') return 'Delivered'
  return 'Sent'
}
