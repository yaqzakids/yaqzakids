import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { getProfile, getChildProfilesReliably } from '@/lib/supabase'
import { hasParentPasscode } from '@/lib/parentPasscode'

export const ONBOARDING_CHILD_KEY = 'yaqza_onboarding_child_id'

async function resolveAuthUserId(userId: string): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id ?? userId
}

async function resolveFreshUser(user: User): Promise<User> {
  await supabase.auth.refreshSession().catch(() => {})
  const {
    data: { user: fresh },
  } = await supabase.auth.getUser()
  return fresh ?? user
}

export function isEmailVerified(user: User): boolean {
  if (user.email_confirmed_at ?? user.confirmed_at) return true

  // OAuth / SSO — provider already verified the email
  const identityProviders = user.identities?.map((identity) => identity.provider) ?? []
  if (identityProviders.some((provider) => provider !== 'email')) return true

  const appProvider = user.app_metadata?.provider
  if (typeof appProvider === 'string' && appProvider !== 'email') return true

  return false
}

/** New signups without a session may need to confirm email before first sign-in. */
export async function needsEmailVerification(userId: string, user: User): Promise<boolean> {
  const effectiveUser = await resolveFreshUser(user)
  if (isEmailVerified(effectiveUser)) return false

  const authUserId = await resolveAuthUserId(userId)

  try {
    const [children, profile] = await Promise.all([
      getChildProfilesReliably(authUserId),
      getProfile(authUserId),
    ])

    if (children.length > 0) return false
    if (profile?.full_name?.trim()) return false
  } catch {
    return false
  }

  return true
}

/**
 * Post-auth setup routes (parent profile, passcode, first child).
 * Does not include verify-email — successful sign-in must never land there.
 */
export async function resolveOnboardingPath(userId: string, _user: User): Promise<string | null> {
  const authUserId = await resolveAuthUserId(userId)

  try {
    const children = await getChildProfilesReliably(authUserId)
    if (children.length > 0) {
      return null
    }
  } catch {
    return null
  }

  const profile = await getProfile(authUserId)
  if (!profile?.full_name?.trim()) {
    return '/onboarding/parent'
  }

  const passcodeReady = await hasParentPasscode(authUserId)
  if (!passcodeReady) {
    return '/onboarding/passcode'
  }

  return '/children/new?onboarding=1'
}

export function isOnboardingPath(pathname: string, search = ''): boolean {
  if (pathname === '/verify-email') return true
  if (pathname === '/onboarding/parent') return true
  if (pathname === '/onboarding/passcode') return true
  if (pathname === '/onboarding/choose-path') return true
  if (pathname === '/children/new' && search.includes('onboarding=1')) return true
  return false
}

export function setPendingAgeGroupChild(childId: string): void {
  sessionStorage.setItem(ONBOARDING_CHILD_KEY, childId)
}

export function clearPendingAgeGroupChild(): void {
  sessionStorage.removeItem(ONBOARDING_CHILD_KEY)
}
