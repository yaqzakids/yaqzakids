export const SUPPORT_CATEGORIES = [
  { value: 'technical_issue', label: 'Technical Issue' },
  { value: 'billing', label: 'Billing' },
  { value: 'subscription', label: 'Subscription' },
  { value: 'child_profile', label: 'Child Profile' },
  { value: 'content_feedback', label: 'Content Feedback' },
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'bug_report', label: 'Bug Report' },
  { value: 'other', label: 'Other' },
] as const

export const SUPPORT_PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
] as const

export const SUPPORT_STATUSES = [
  { value: 'open', label: 'Open' },
  { value: 'pending_parent', label: 'Pending Parent' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
] as const

export const PARENT_TICKET_TABS = [
  {
    value: 'active',
    label: 'Active',
    statuses: ['open', 'pending_parent', 'in_progress'],
  },
  { value: 'resolved', label: 'Resolved', statuses: ['resolved'] },
  { value: 'closed', label: 'Closed', statuses: ['closed'] },
] as const

export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number]['value']
export type SupportPriority = (typeof SUPPORT_PRIORITIES)[number]['value']
export type SupportStatus = (typeof SUPPORT_STATUSES)[number]['value']
export type SupportSenderType = 'parent' | 'admin' | 'system'

export function categoryLabel(value: string): string {
  return SUPPORT_CATEGORIES.find((c) => c.value === value)?.label ?? value.replace(/_/g, ' ')
}

export function priorityLabel(value: string): string {
  return SUPPORT_PRIORITIES.find((p) => p.value === value)?.label ?? value
}

export function statusLabel(value: string): string {
  return SUPPORT_STATUSES.find((s) => s.value === value)?.label ?? value.replace(/_/g, ' ')
}

/** Parent-facing labels — clearer than internal admin status names. */
export function parentStatusLabel(value: string): string {
  if (value === 'open') return 'Awaiting Support'
  if (value === 'pending_parent') return 'Reply Needed'
  if (value === 'in_progress') return 'In Progress'
  if (value === 'resolved') return 'Resolved'
  if (value === 'closed') return 'Closed'
  return statusLabel(value)
}

export function statusBadgeVariant(
  status: string
): 'success' | 'warning' | 'danger' | 'muted' | 'gold' {
  if (status === 'open') return 'danger'
  if (status === 'pending_parent' || status === 'in_progress') return 'warning'
  if (status === 'resolved') return 'success'
  if (status === 'closed') return 'muted'
  return 'muted'
}

export function priorityBadgeVariant(priority: string): 'success' | 'warning' | 'danger' | 'muted' {
  if (priority === 'high') return 'danger'
  if (priority === 'normal') return 'warning'
  return 'muted'
}

export const SUPPORT_ATTACHMENT_BUCKET = 'support-attachments'
export const SUPPORT_MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024
export const SUPPORT_ALLOWED_ATTACHMENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
