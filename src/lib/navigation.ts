import type { Location } from 'react-router-dom'
import type { ChildProfile } from '@/lib/types'
import { dashboardPathForAgeGroup } from '@/lib/childProfiles'

export const REDIRECT_PARAM = 'redirectTo'

/** Internal paths only — blocks open redirects */
export function sanitizeRedirectPath(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== 'string') return null
  const path = raw.trim()
  if (!path.startsWith('/') || path.startsWith('//')) return null
  if (path.includes('://')) return null
  return normalizeDiscovererHomeRedirect(path)
}

/** Legacy discoverer dashboard URL should land on the child home page after auth/child pick. */
export function normalizeDiscovererHomeRedirect(path: string): string {
  if (path === '/discoverer/dashboard') return '/discoverer'
  return path
}

export function currentPathWithSearch(location: Pick<Location, 'pathname' | 'search'>): string {
  return `${location.pathname}${location.search}`
}

export function readRedirectParam(search: string): string | null {
  return sanitizeRedirectPath(new URLSearchParams(search).get(REDIRECT_PARAM))
}

/** Merge redirect from query param, legacy location.state, or pathname string */
export function resolveAuthRedirect(
  search: string,
  stateFrom?: unknown
): string | null {
  const fromQuery = readRedirectParam(search)
  if (fromQuery) return fromQuery

  if (typeof stateFrom === 'string') {
    return sanitizeRedirectPath(stateFrom)
  }

  if (stateFrom && typeof stateFrom === 'object' && 'pathname' in stateFrom) {
    const loc = stateFrom as Location
    return sanitizeRedirectPath(currentPathWithSearch(loc))
  }

  return null
}

export function authUrl(
  authPath: '/login' | '/signup' | '/forgot-password',
  redirectTo?: string | null
): string {
  const safe = sanitizeRedirectPath(redirectTo ?? null)
  if (!safe) return authPath
  return `${authPath}?${REDIRECT_PARAM}=${encodeURIComponent(safe)}`
}

export function authUrlForLocation(
  authPath: '/login' | '/signup' | '/forgot-password',
  location: Pick<Location, 'pathname' | 'search'>
): string {
  if (location.pathname === authPath) return authPath
  return authUrl(authPath, currentPathWithSearch(location))
}

const PUBLIC_PREFIXES = [
  '/welcome',
  '/explorer',
  '/discoverer',
  '/thinker',
  '/sample-stories',
  '/paths',
  '/parents',
  '/pricing',
  '/about',
  '/adventures',
  '/article/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
]

const CHILD_ROUTE_PREFIXES = [
  '/explorer/dashboard',
  '/discoverer/dashboard',
  '/discoverer/mission',
  '/discoverer/badges',
  '/discoverer/certificates',
  '/discoverer/library',
  '/discoverer/explore',
  '/discoverer/journey',
  '/discoverer/profile',
  '/discoverer/streaks',
  '/discoverer/rewards',
  '/thinker/dashboard',
]

export function isPublicPath(path: string): boolean {
  if (path === '/') return true
  return PUBLIC_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(prefix)
  )
}

export function requiresActiveChild(path: string): boolean {
  if (path.startsWith('/adventures/') && path.split('/').length > 2) return true
  return CHILD_ROUTE_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  )
}

export function isParentPath(path: string): boolean {
  return (
    path === '/dashboard' ||
    path === '/parent/dashboard' ||
    path === '/parent/account' ||
    path.startsWith('/support') ||
    path.startsWith('/messages') ||
    path.startsWith('/admin')
  )
}

export function childrenPickerUrl(redirectTo?: string | null): string {
  const safe = sanitizeRedirectPath(redirectTo ?? null)
  if (!safe) return '/children'
  return `/children?${REDIRECT_PARAM}=${encodeURIComponent(safe)}`
}

export function activeChildHomePath(child: ChildProfile): string {
  return dashboardPathForAgeGroup(child.age_group)
}

export function loginDestination(path: string): string {
  return authUrl('/login', path)
}
