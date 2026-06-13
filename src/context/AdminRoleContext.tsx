import { createContext, useContext } from 'react'

export type AdminRole =
  | 'owner'
  | 'admin'
  | 'editor'
  | 'support'
  | 'content_editor'
  | 'support_agent'
  | 'finance_admin'
  | 'viewer'

const VALID_ADMIN_ROLES: AdminRole[] = [
  'owner',
  'admin',
  'editor',
  'support',
  'content_editor',
  'support_agent',
  'finance_admin',
  'viewer',
]

const ROLE_ALIASES: Record<string, AdminRole> = {
  content_editor: 'editor',
  support_agent: 'support',
  finance_admin: 'admin',
  viewer: 'editor',
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
    canEditContent: ['owner', 'admin', 'editor'].includes(normalized),
    canManageUsers: normalized === 'owner',
    canManagePayments: ['owner', 'admin'].includes(normalized),
    canManageSupport: ['owner', 'admin', 'support'].includes(normalized),
    canViewAnalytics: ['owner', 'admin', 'editor', 'support'].includes(normalized),
  }
}

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  owner: 'OWNER',
  admin: 'ADMIN',
  editor: 'EDITOR',
  support: 'SUPPORT',
  content_editor: 'CONTENT EDITOR',
  support_agent: 'SUPPORT AGENT',
  finance_admin: 'FINANCE ADMIN',
  viewer: 'VIEWER',
}
