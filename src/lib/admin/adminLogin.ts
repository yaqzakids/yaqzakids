import type { NavigateFunction } from 'react-router-dom'
import {
  checkIsAuthorizedAdmin,
  checkMustChangePassword,
  clearMustChangePassword,
  isMainAdminEmail,
  linkAdminUserAccount,
  recordAdminLogin,
} from '@/lib/admin/adminUsers'
import { supabase } from '@/lib/supabase'

export async function completeAdminLogin(navigate: NavigateFunction): Promise<'success' | 'denied' | 'change-password'> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return 'denied'

  await linkAdminUserAccount()
  const isAdmin = await checkIsAuthorizedAdmin(user)
  if (!isAdmin) {
    await supabase.auth.signOut()
    return 'denied'
  }

  await recordAdminLogin()

  const mustChange = await checkMustChangePassword()
  if (mustChange && !isMainAdminEmail(user.email)) {
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
  'Access denied. You are not authorised to access this area.'
