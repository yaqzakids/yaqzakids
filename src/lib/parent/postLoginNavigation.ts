import type { NavigateFunction } from 'react-router-dom'
import { STORAGE_KEYS } from '@/lib/adventure/constants'
import { profilePathForAgeGroup } from '@/lib/childProfiles'
import { isParentPath, isPublicPath, sanitizeRedirectPath } from '@/lib/navigation'
import { getChildProfilesReliably } from '@/lib/supabase'
import { persistActiveChildSelection } from '@/lib/activeChild'

export const ADD_CHILD_PATH = '/children/new'

const BLOCKED_POST_LOGIN_PATHS = [
  '/verify-email',
  '/onboarding/parent',
  '/onboarding/passcode',
  '/onboarding/choose-path',
  ADD_CHILD_PATH,
]

function clearStoredChildSelection(): void {
  localStorage.removeItem(STORAGE_KEYS.activeChild)
  localStorage.removeItem(STORAGE_KEYS.selectedChildId)
}

function sanitizePostLoginRedirect(redirectTo: string | null): string | null {
  const safe = sanitizeRedirectPath(redirectTo)
  if (!safe) return null
  if (BLOCKED_POST_LOGIN_PATHS.some((blocked) => safe === blocked || safe.startsWith(`${blocked}?`))) {
    return null
  }
  return safe
}

function destinationForRedirect(redirectTo: string | null): string | null {
  const safe = sanitizePostLoginRedirect(redirectTo)
  if (!safe) return null

  if (isPublicPath(safe) || isParentPath(safe)) {
    return safe
  }

  return null
}

function readStoredChildId(): string | null {
  return (
    localStorage.getItem(STORAGE_KEYS.activeChild) ??
    localStorage.getItem(STORAGE_KEYS.selectedChildId)
  )
}

/** Default destination after sign-in — add child for new accounts, otherwise profile or picker. */
export async function navigateToChildExperienceAfterLogin(
  userId: string,
  navigate: NavigateFunction,
  redirectTo: string | null = null
): Promise<void> {
  const custom = destinationForRedirect(redirectTo)
  if (custom) {
    navigate(custom, { replace: true })
    return
  }

  let children
  try {
    children = await getChildProfilesReliably(userId)
  } catch {
    clearStoredChildSelection()
    navigate(ADD_CHILD_PATH, { replace: true })
    return
  }

  if (children.length === 0) {
    clearStoredChildSelection()
    navigate(ADD_CHILD_PATH, { replace: true })
    return
  }

  if (children.length === 1) {
    const child = children[0]
    persistActiveChildSelection({ id: child.id, age_group: child.age_group })
    navigate(profilePathForAgeGroup(child.age_group), { replace: true })
    return
  }

  const storedId = readStoredChildId()
  const remembered = storedId ? children.find((child) => child.id === storedId) : null
  if (remembered) {
    persistActiveChildSelection({ id: remembered.id, age_group: remembered.age_group })
    navigate(profilePathForAgeGroup(remembered.age_group), { replace: true })
    return
  }

  navigate('/children', { replace: true })
}
