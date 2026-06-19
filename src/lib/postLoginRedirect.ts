import type { NavigateFunction } from 'react-router-dom'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import {
  clearPendingVerifyEmail,
  hasAuthCallbackInUrl,
  waitForAuthSessionFromUrl,
} from '@/lib/auth/authCallback'
import { navigateToChildExperienceAfterLogin } from '@/lib/parent/postLoginNavigation'
import { getChildProfilesReliably } from '@/lib/supabase'

/** True when this parent has at least one child profile row. */
export async function parentHasChildProfiles(userId: string): Promise<boolean> {
  try {
    const children = await getChildProfilesReliably(userId)
    return children.length > 0
  } catch {
    return false
  }
}

/** Where signed-in parents land — profile or child picker only. */
export async function redirectAfterLogin(
  userId: string,
  navigate: NavigateFunction,
  redirectTo: string | null = null
): Promise<void> {
  await navigateToChildExperienceAfterLogin(userId, navigate, redirectTo)
}

/** Post-login navigation — never verify-email or forced add-child onboarding. */
export async function navigateAfterAuth(
  _userId: string,
  navigate: NavigateFunction,
  redirectTo: string | null,
  user?: User | null
): Promise<void> {
  clearPendingVerifyEmail()

  if (hasAuthCallbackInUrl()) {
    const session = await waitForAuthSessionFromUrl()
    if (session?.user) {
      window.history.replaceState({}, document.title, window.location.pathname)
      await navigateToChildExperienceAfterLogin(session.user.id, navigate, redirectTo)
      return
    }
  }

  await supabase.auth.refreshSession().catch(() => {})

  for (let attempt = 0; attempt < 5; attempt++) {
    const {
      data: { user: freshUser },
    } = await supabase.auth.getUser()
    if (freshUser?.id) {
      await navigateToChildExperienceAfterLogin(freshUser.id, navigate, redirectTo)
      return
    }
    await new Promise((resolve) => setTimeout(resolve, 100 * (attempt + 1)))
  }

  const authUser = user ?? null
  if (!authUser) {
    navigate('/login', { replace: true })
    return
  }

  await navigateToChildExperienceAfterLogin(authUser.id, navigate, redirectTo)
}
