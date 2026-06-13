import type { User } from '@supabase/supabase-js'
import { getChildProfiles, getProfile } from '@/lib/supabase'

export const ONBOARDING_CHILD_KEY = 'yaqza_onboarding_child_id'

export function isEmailVerified(user: User): boolean {
  return Boolean(user.email_confirmed_at ?? user.confirmed_at)
}

export function isOnboardingPath(pathname: string, search = ''): boolean {
  if (pathname === '/verify-email') return true
  if (pathname === '/onboarding/parent') return true
  if (pathname === '/onboarding/choose-path') return true
  if (pathname === '/children/new' && search.includes('onboarding=1')) return true
  return false
}

/** Next required onboarding route, or null when onboarding is complete. */
export async function resolveOnboardingPath(userId: string, user: User): Promise<string | null> {
  if (!isEmailVerified(user)) {
    return '/verify-email'
  }

  const profile = await getProfile(userId)
  if (!profile?.full_name?.trim()) {
    return '/onboarding/parent'
  }

  const kids = await getChildProfiles(userId)
  if (kids.length === 0) {
    return '/children/new?onboarding=1'
  }

  const pendingChildId = sessionStorage.getItem(ONBOARDING_CHILD_KEY)
  if (pendingChildId && kids.some((child) => child.id === pendingChildId)) {
    return `/onboarding/choose-path?childId=${pendingChildId}`
  }

  return null
}

export function setPendingAgeGroupChild(childId: string): void {
  sessionStorage.setItem(ONBOARDING_CHILD_KEY, childId)
}

export function clearPendingAgeGroupChild(): void {
  sessionStorage.removeItem(ONBOARDING_CHILD_KEY)
}
