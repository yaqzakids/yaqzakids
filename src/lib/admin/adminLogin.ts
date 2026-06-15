import type { NavigateFunction } from 'react-router-dom'
import { MAIN_ADMIN_EMAIL } from '@/lib/constants'
import {
  checkIsActiveAdmin,
  checkMustChangePassword,
  clearMustChangePassword,
  isMainAdminEmail,
  linkAdminUserAccount,
  recordAdminLogin,
} from '@/lib/admin/adminUsers'
import { supabase } from '@/lib/supabase'

export function normalizeEmail(email: string | null | undefined): string {
  return (email ?? '').trim().toLowerCase()
}

export async function completeAdminLogin(navigate: NavigateFunction): Promise<'success' | 'denied' | 'change-password'> {
  await linkAdminUserAccount()
  const isAdmin = await checkIsActiveAdmin()
  if (!isAdmin) {
    await supabase.auth.signOut()
    return 'denied'
  }

  await recordAdminLogin()

  const mustChange = await checkMustChangePassword()
  if (mustChange && !isMainAdminEmail((await supabase.auth.getUser()).data.user?.email)) {
    navigate('/admin/change-password', { replace: true })
    return 'change-password'
  }

  navigate('/admin', { replace: true })
  return 'success'
}

export async function completeAdminPasswordChange(
  newPassword: string,
  navigate: NavigateFunction
): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
  await clearMustChangePassword()
  navigate('/admin', { replace: true })
}

export const ADMIN_LOGIN_DENIED_MESSAGE =
  'This account is not authorized for admin access.'

export const ADMIN_FORGOT_PASSWORD_MESSAGE = `Need help? Contact ${MAIN_ADMIN_EMAIL}.`
