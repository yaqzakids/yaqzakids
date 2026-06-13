import type { NavigateFunction } from 'react-router-dom'
import { MAIN_ADMIN_EMAIL, SITE_EMAILS } from '@/lib/constants'
import { REDIRECT_PARAM, sanitizeRedirectPath } from '@/lib/navigation'
import { checkIsAdmin, linkAdminUserAccount } from '@/lib/admin/adminUsers'
import { supabase } from '@/lib/supabase'

export const ADMIN_LOGIN_EMAILS = [MAIN_ADMIN_EMAIL, SITE_EMAILS.admin] as const

export function normalizeEmail(email: string | null | undefined): string {
  return (email ?? '').trim().toLowerCase()
}

export function isAuthorizedAdminLoginEmail(email: string | null | undefined): boolean {
  const normalized = normalizeEmail(email)
  return ADMIN_LOGIN_EMAILS.some((allowed) => allowed === normalized)
}

/** True when login was opened for /admin (e.g. /login?redirectTo=/admin). */
export function isAdminLoginMode(search: string, redirectTo: string | null): boolean {
  if (redirectTo === '/admin') return true
  const raw = new URLSearchParams(search).get(REDIRECT_PARAM)
  if (!raw) return false
  return sanitizeRedirectPath(raw) === '/admin'
}

export async function completeAdminLogin(navigate: NavigateFunction): Promise<'success' | 'denied'> {
  await linkAdminUserAccount()
  const isAdmin = await checkIsAdmin()
  if (isAdmin) {
    navigate('/admin', { replace: true })
    return 'success'
  }
  await supabase.auth.signOut()
  return 'denied'
}

export const ADMIN_LOGIN_DENIED_MESSAGE =
  'You do not have permission to access this page.'

export const ADMIN_LOGIN_UNAUTHORIZED_EMAIL_MESSAGE =
  'This email is not authorized for admin access.'

export const ADMIN_FORGOT_PASSWORD_MESSAGE = `Forgot password? Contact ${MAIN_ADMIN_EMAIL} or ${SITE_EMAILS.admin}.`
