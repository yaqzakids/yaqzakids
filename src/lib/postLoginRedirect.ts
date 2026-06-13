import type { NavigateFunction } from 'react-router-dom'
import { supabase, getChildProfiles } from '@/lib/supabase'
import { STORAGE_KEYS } from '@/lib/adventure/constants'
import { STORAGE_KEYS as APP_STORAGE_KEYS } from '@/lib/constants'
import {
  isParentPath,
  isPublicPath,
  requiresActiveChild,
  sanitizeRedirectPath,
} from '@/lib/navigation'
import type { ChildProfile } from '@/lib/types'

function persistActiveChild(child: ChildProfile) {
  localStorage.setItem(STORAGE_KEYS.selectedChildId, child.id)
  localStorage.setItem(APP_STORAGE_KEYS.ageGroup, child.age_group)
}

function destinationForRedirect(
  redirectTo: string | null,
  child: ChildProfile | null
): string | null {
  if (!redirectTo) return null

  if (isPublicPath(redirectTo) || isParentPath(redirectTo)) {
    return redirectTo
  }

  if (requiresActiveChild(redirectTo)) {
    return child ? redirectTo : null
  }

  return redirectTo
}

/** Post-login navigation for parents and admins */
export async function navigateAfterAuth(
  userId: string,
  navigate: NavigateFunction,
  redirectTo: string | null
): Promise<void> {
  const safeRedirect = sanitizeRedirectPath(redirectTo)

  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (isAdmin) {
    const adminDest =
      safeRedirect && safeRedirect.startsWith('/admin') ? safeRedirect : '/admin'
    navigate(adminDest, { replace: true })
    return
  }

  const kids = await getChildProfiles(userId)

  if (kids.length === 0) {
    navigate('/children/new', { replace: true })
    return
  }

  if (kids.length >= 1) {
    const singleChild = kids.length === 1 ? kids[0] : null
    if (singleChild) {
      persistActiveChild(singleChild)
    }
    const resolved = destinationForRedirect(safeRedirect, singleChild)
    if (resolved) {
      navigate(resolved, { replace: true })
      return
    }
    navigate('/children', { replace: true })
    return
  }
}
