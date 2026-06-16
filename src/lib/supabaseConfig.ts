const RATE_LIMIT_SECONDS_RE = /after (\d+) seconds?/i

/** Turn Supabase auth errors into short, user-friendly messages. */
export function formatAuthError(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const raw =
    err && typeof err === 'object' && 'message' in err
      ? String((err as { message: string }).message)
      : err instanceof Error
        ? err.message
        : fallback

  const rateMatch = raw.match(RATE_LIMIT_SECONDS_RE)
  if (rateMatch) {
    const seconds = rateMatch[1]
    return `Please wait ${seconds} seconds before requesting another email. This limit helps keep your account secure.`
  }

  if (/for security purposes/i.test(raw)) {
    return 'Please wait a minute before requesting another email, then try again.'
  }

  if (/invalid api key/i.test(raw)) {
    return 'This site is using an invalid Supabase API key. In Supabase Dashboard → Project Settings → API, copy the anon (legacy) or publishable key for project cgvzeydhhkwosphixznd, update VITE_SUPABASE_ANON_KEY in .env, run npm run prebuild, and redeploy. Also check Cloudflare Pages env vars for a stale key.'
  }

  if (/invalid path specified in request url/i.test(raw)) {
    return 'Supabase URL is misconfigured. VITE_SUPABASE_URL must be https://cgvzeydhhkwosphixznd.supabase.co with no /rest/v1 path. Fix .env, run npm run prebuild, and redeploy.'
  }

  return raw.replace(/^Failed to send password recovery:\s*/i, '').trim() || fallback
}
