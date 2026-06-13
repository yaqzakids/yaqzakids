/** Format Supabase/PostgREST errors (plain objects, not Error instances) for UI display. */
export function formatSupabaseError(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>
    const code = typeof e.code === 'string' ? e.code : ''
    const message = typeof e.message === 'string' ? e.message : ''

    if (code === 'PGRST204' && /child_profiles.*\bage\b|\bage\b.*child_profiles/i.test(message)) {
      return (
        'The child_profiles.age column is missing. ' +
        'Open Supabase → SQL Editor, run supabase/apply_child_profile_fields.sql, then try again. ' +
        `(${message})`
      )
    }

    if (code === 'PGRST204' && /child_profiles.*interests|interests.*child_profiles/i.test(message)) {
      return (
        'The child_profiles.interests column is missing. ' +
        'Open Supabase → SQL Editor, run supabase/apply_child_profile_fields.sql, then try again. ' +
        `(${message})`
      )
    }

    if (code === 'PGRST205' && /payment_records|failed_payment_events|trial_extensions|manual_access_grants/i.test(message)) {
      return (
        'Payments tables are not installed on Supabase yet. ' +
        'Run supabase/apply_payments_admin.sql in the Supabase SQL Editor, then refresh. ' +
        `(${message})`
      )
    }

    if (code === 'PGRST205' && /conversations|broadcasts|messages|announcements/i.test(message)) {
      return (
        'Messaging tables are not installed on Supabase yet. ' +
        'Run supabase/apply_messaging_force.sql in the Supabase SQL Editor, then refresh. ' +
        `(${message})`
      )
    }

    const parts = [e.message, e.details, e.hint, e.code ? `code: ${e.code}` : null].filter(
      (part) => typeof part === 'string' && part.length > 0,
    )
    if (parts.length > 0) return parts.join(' — ')
  }
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  return 'Unknown error'
}
