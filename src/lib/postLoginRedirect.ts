import type { NavigateFunction } from 'react-router-dom'
import type { User } from '@supabase/supabase-js'
import { supabase, getChildProfiles } from '@/lib/supabase'
import { resolveOnboardingPath } from '@/lib/onboarding'
import { isParentPath, isPublicPath, sanitizeRedirectPath } from '@/lib/navigation'

function destinationForRedirect(redirectTo: string | null): string | null {
  if (!redirectTo) return null

  if (isPublicPath(redirectTo) || isParentPath(redirectTo)) {
    return redirectTo
  }

  return null
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
    navigate('/children/new', { replace: true })
    return
  }

  const resolved = destinationForRedirect(safeRedirect)
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
    navigate('/admin', { replace: true })
    return
  }

  await navigateAfterParentOnboarding(authUser, navigate, redirectTo)
}
