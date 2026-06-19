import type { Location } from 'react-router-dom'
import type { ChildProfile } from '@/lib/types'
import { dashboardPathForAgeGroup, profilePathForAgeGroup } from '@/lib/childProfiles'

export const REDIRECT_PARAM = 'redirectTo'

/** Public marketing homepage — safe for all users (no auth/onboarding redirects). */
export const PUBLIC_HOME_PATH = '/welcome'

export function appHomePath(hasActiveChild: boolean): string {
  return hasActiveChild ? '/home' : PUBLIC_HOME_PATH
}

/** Internal paths only — blocks open redirects and onboarding trap loops */
export function sanitizeRedirectPath(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== 'string') return null
  const path = raw.trim()
  if (!path.startsWith('/') || path.startsWith('//')) return null
  if (path.includes('://')) return null

  const pathname = path.split('?')[0]
  const blocked = [
    '/verify-email',
    '/onboarding/parent',
    '/onboarding/passcode',
    '/onboarding/choose-path',
    '/children/new',
  ]
  if (blocked.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return null
  }

  return normalizeDiscovererHomeRedirect(path)
}

/** Normalize dashboard URLs to age path home after auth/child pick. */
export function normalizeChildHomeRedirect(path: string): string {
  if (path === '/discoverer/dashboard') return '/discoverer'
  if (path === '/explorer/dashboard') return '/explorer'
  if (path === '/thinker/dashboard') return '/thinker'
  return path
}

/** @deprecated Use normalizeChildHomeRedirect */
export function normalizeDiscovererHomeRedirect(path: string): string {
  return normalizeChildHomeRedirect(path)
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
  '/verify-email',
  '/onboarding/parent',
  '/onboarding/choose-path',
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
    path.startsWith('/account/settings') ||
    path.startsWith('/children') ||
    path.startsWith('/support') ||
    path === '/parent/messages' ||
    path.startsWith('/parent/messages') ||
    path.startsWith('/messages') ||
    path.startsWith('/admin')
  )
}

/** Routes that should always show marketing navigation, even when a child is selected. */
const ALWAYS_PUBLIC_NAV = [
  '/paths',
  '/parents',
  '/sample-stories',
  '/about',
  '/pricing',
  '/welcome',
] as const

export function isAlwaysPublicNavPath(path: string): boolean {
  return ALWAYS_PUBLIC_NAV.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
}

export function shouldUseChildNav(pathname: string): boolean {
  if (isAlwaysPublicNavPath(pathname)) return false
  if (
    pathname === '/discoverer' ||
    pathname === '/explorer' ||
    pathname === '/thinker' ||
    pathname.startsWith('/discoverer/') ||
    pathname.startsWith('/explorer/') ||
    pathname.startsWith('/thinker/')
  ) {
    return true
  }
  if (requiresActiveChild(pathname)) return true
  if (pathname.startsWith('/adventures/') && pathname.split('/').filter(Boolean).length > 1) {
    return true
  }
  if (pathname === '/adventures') return true
  return false
}

export function childrenPickerUrl(redirectTo?: string | null): string {
  const safe = sanitizeRedirectPath(redirectTo ?? null)
  if (!safe) return '/children'
  return `/children?${REDIRECT_PARAM}=${encodeURIComponent(safe)}`
}

export function activeChildHomePath(child: ChildProfile): string {
  return dashboardPathForAgeGroup(child.age_group)
}

export function activeChildProfileDashboardPath(child: ChildProfile): string {
  return profilePathForAgeGroup(child.age_group)
}

export function loginDestination(path: string): string {
  return authUrl('/login', path)
}
