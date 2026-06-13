import type { NavigateFunction } from 'react-router-dom'
import type { User } from '@supabase/supabase-js'
import { supabase, getChildProfiles } from '@/lib/supabase'
import { STORAGE_KEYS } from '@/lib/adventure/constants'
import { STORAGE_KEYS as APP_STORAGE_KEYS } from '@/lib/constants'
import { resolveOnboardingPath } from '@/lib/onboarding'
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

async function navigateAfterParentOnboarding(
  user: User,
  navigate: NavigateFunction,
  redirectTo: string | null
): Promise<void> {
  const onboardingPath = await resolveOnboardingPath(user.id, user)
  if (onboardingPath) {
    navigate(onboardingPath, { replace: true })
    return
  }

  const safeRedirect = sanitizeRedirectPath(redirectTo)
  const kids = await getChildProfiles(user.id)

  if (kids.length === 0) {
    navigate('/children/new?onboarding=1', { replace: true })
    return
  }

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
}

/** Post-login navigation for parents and admins */
export async function navigateAfterAuth(
  _userId: string,
  navigate: NavigateFunction,
  redirectTo: string | null,
  user?: User | null
): Promise<void> {
  const authUser = user ?? (await supabase.auth.getUser()).data.user
  if (!authUser) {
    navigate('/login', { replace: true })
    return
  }

  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (isAdmin) {
    const safeRedirect = sanitizeRedirectPath(redirectTo)
    const adminDest =
      safeRedirect && safeRedirect.startsWith('/admin') ? safeRedirect : '/admin'
    navigate(adminDest, { replace: true })
    return
  }

  await navigateAfterParentOnboarding(authUser, navigate, redirectTo)
}
