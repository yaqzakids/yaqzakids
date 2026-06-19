/** Detect Supabase email confirmation / magic-link tokens in the URL. */
export function hasAuthCallbackInUrl(): boolean {
  if (typeof window === 'undefined') return false
  const hash = window.location.hash
  const search = window.location.search
  return (
    hash.includes('access_token=') ||
    hash.includes('type=signup') ||
    hash.includes('type=email') ||
    hash.includes('type=magiclink') ||
    hash.includes('type=recovery') ||
    search.includes('code=') ||
    search.includes('token_hash=')
  )
}

export function isPasswordRecoveryCallback(): boolean {
  if (typeof window === 'undefined') return false
  const hash = window.location.hash
  const search = window.location.search
  return hash.includes('type=recovery') || search.includes('type=recovery')
}

/** Email confirmation links from signup — not OAuth sign-in. */
export function isEmailVerificationCallback(): boolean {
  if (typeof window === 'undefined') return false
  const hash = window.location.hash
  const search = window.location.search
  return (
    hash.includes('type=signup') ||
    hash.includes('type=email') ||
    hash.includes('type=magiclink') ||
    search.includes('type=signup') ||
    search.includes('type=email') ||
    search.includes('token_hash=')
  )
}

import { getActiveSiteUrl } from '@/lib/supabase'

function siteOrigin(): string {
  if (typeof window !== 'undefined') {
    const runtimeSite = getActiveSiteUrl()
    if (runtimeSite) return runtimeSite.replace(/\/$/, '')
  }
  const configuredSite = import.meta.env.VITE_SITE_URL as string | undefined
  if (configuredSite?.trim()) {
    return configuredSite.replace(/\/$/, '')
  }
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return 'https://www.yaqzakids.com'
}

/** Supabase redirect after clicking the signup confirmation link — lands on login, not verify-email. */
export function signUpEmailConfirmUrl(): string {
  return `${siteOrigin()}/login`
}

/** @deprecated Use signUpEmailConfirmUrl */
export function verifyEmailCallbackUrl(): string {
  return signUpEmailConfirmUrl()
}

export function passwordResetCallbackUrl(): string {
  return `${siteOrigin()}/reset-password`
}

/** Route auth callback tokens to the correct handler page. */
export function authCallbackRouteWithCallback(): string {
  const suffix = `${window.location.search}${window.location.hash}`
  if (isPasswordRecoveryCallback()) {
    return `/reset-password${suffix}`
  }
  // Email confirmation, OAuth, and other sign-in callbacks
  return `/login${suffix}`
}

export function verifyEmailRouteWithCallback(): string {
  return authCallbackRouteWithCallback()
}

export const PENDING_VERIFY_EMAIL_KEY = 'yaqza_pending_verify_email'

export function storePendingVerifyEmail(email: string): void {
  sessionStorage.setItem(PENDING_VERIFY_EMAIL_KEY, email.trim().toLowerCase())
}

export function readPendingVerifyEmail(): string | null {
  return sessionStorage.getItem(PENDING_VERIFY_EMAIL_KEY)
}

export function clearPendingVerifyEmail(): void {
  sessionStorage.removeItem(PENDING_VERIFY_EMAIL_KEY)
}

/** Verify-email page is only shown immediately after sign-up (pending flag) or legacy email links. */
export function shouldShowVerifyEmailPage(): boolean {
  if (readPendingVerifyEmail()) return true
  return hasAuthCallbackInUrl() && isEmailVerificationCallback()
}

/** Wait for Supabase client to exchange URL tokens for a session. */
export async function waitForAuthSessionFromUrl(maxAttempts = 12, delayMs = 250) {
  const { supabase } = await import('@/lib/supabase')

  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.session?.user) return data.session
  }

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) return session

    if (hasAuthCallbackInUrl()) {
      await supabase.auth.refreshSession().catch(() => {})
      const retry = await supabase.auth.getSession()
      if (retry.data.session?.user) return retry.data.session
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs))
  }

  return null
}
