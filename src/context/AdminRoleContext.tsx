import { createContext, useContext } from 'react'

export type AdminRole =
  | 'owner'
  | 'admin'
  | 'editor'
  | 'support'
  | 'content_writer'
  | 'reviewer'
  | 'content_editor'
  | 'support_agent'
  | 'finance_admin'
  | 'viewer'

const VALID_ADMIN_ROLES: AdminRole[] = [
  'owner',
  'admin',
  'editor',
  'support',
  'content_writer',
  'reviewer',
  'content_editor',
  'support_agent',
  'finance_admin',
  'viewer',
]

const ROLE_ALIASES: Record<string, AdminRole> = {
  content_editor: 'editor',
  support_agent: 'support',
  finance_admin: 'admin',
  viewer: 'reviewer',
}

export function normalizeAdminRole(value: unknown): AdminRole | null {
  if (typeof value !== 'string') return null
  if (VALID_ADMIN_ROLES.includes(value as AdminRole)) {
    return ROLE_ALIASES[value] ?? (value as AdminRole)
  }
  return null
}

export function parseAdminRole(value: unknown): AdminRole | null {
  return normalizeAdminRole(value)
}

interface AdminRoleContextType {
  adminRole: AdminRole
  isOwner: boolean
  canEditContent: boolean
  canPublishContent: boolean
  canReviewContent: boolean
  canManageUsers: boolean
  canManagePayments: boolean
  canViewAnalytics: boolean
  canManageSupport: boolean
}

export const AdminRoleContext = createContext<AdminRoleContextType | null>(null)

export const useAdminRole = () => {
  const ctx = useContext(AdminRoleContext)
  if (!ctx) {
    throw new Error('useAdminRole must be used within AdminRoleContext.Provider')
  }
  return ctx
}

export function getPermissions(role: AdminRole): Omit<AdminRoleContextType, 'adminRole'> {
  const normalized = normalizeAdminRole(role) ?? 'editor'
  return {
    isOwner: normalized === 'owner',
    canEditContent: ['owner', 'admin', 'editor', 'reviewer'].includes(normalized),
    canPublishContent: ['owner', 'admin', 'editor'].includes(normalized),
    canReviewContent: ['owner', 'admin', 'reviewer'].includes(normalized),
    canManageUsers: normalized === 'owner',
    canManagePayments: ['owner', 'admin'].includes(normalized),
    canManageSupport: ['owner', 'admin', 'support'].includes(normalized),
    canViewAnalytics: ['owner', 'admin', 'editor', 'support', 'reviewer'].includes(normalized),
  }
}

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  owner: 'OWNER',
  admin: 'ADMIN',
  editor: 'EDITOR',
  support: 'SUPPORT',
  content_writer: 'CONTENT WRITER',
  reviewer: 'REVIEWER',
  content_editor: 'CONTENT EDITOR',
  support_agent: 'SUPPORT AGENT',
  finance_admin: 'FINANCE ADMIN',
  viewer: 'VIEWER',
}

export function canAccessAdminPath(role: AdminRole, pathname: string): boolean {
  const perms = getPermissions(role)
  const path = pathname.replace(/\/$/, '') || '/admin'

  if (path === '/admin' || path.startsWith('/admin/settings/profile')) return true
  if (path.startsWith('/admin/team') || path.startsWith('/admin/admin-users')) {
    return perms.canManageUsers
  }
  if (path.startsWith('/admin/change-password')) return true

  if (
    path.startsWith('/admin/content') ||
    path.startsWith('/admin/articles') ||
    path.startsWith('/admin/quizzes') ||
    path.startsWith('/admin/adventures') ||
    path.startsWith('/admin/paths')
  ) {
    if (role === 'content_writer') {
      return path.includes('/articles') || path.includes('/content')
    }
    if (role === 'reviewer') {
      return path.includes('/articles') || path.includes('/content')
    }
    return perms.canEditContent || perms.canPublishContent || perms.canReviewContent
  }

  if (
    path.startsWith('/admin/payments') ||
    path.startsWith('/admin/pricing') ||
    path.startsWith('/admin/discounts') ||
    path.startsWith('/admin/refunds') ||
    path.startsWith('/admin/subscriptions')
  ) {
    return perms.canManagePayments
  }

  if (
    path.startsWith('/admin/support') ||
    path.startsWith('/admin/messages') ||
    path.startsWith('/admin/announcements')
  ) {
    return perms.canManageSupport
  }

  if (
    path.startsWith('/admin/families') ||
    path.startsWith('/admin/children') ||
    path.startsWith('/admin/users') ||
    path.startsWith('/admin/progress')
  ) {
    return ['owner', 'admin', 'support'].includes(role)
  }

  if (path.startsWith('/admin/analytics')) {
    return perms.canViewAnalytics
  }

  if (path.startsWith('/admin/settings') || path.startsWith('/admin/log')) {
    return ['owner', 'admin'].includes(role)
  }

  return perms.isOwner || role === 'admin'
}
