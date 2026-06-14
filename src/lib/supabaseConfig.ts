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

  return raw.replace(/^Failed to send password recovery:\s*/i, '').trim() || fallback
}
