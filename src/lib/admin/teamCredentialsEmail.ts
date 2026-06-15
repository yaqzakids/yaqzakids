import { getActiveSiteUrl, supabase } from '@/lib/supabase'

export interface SendTeamCredentialsInput {
  toEmail: string
  fullName?: string | null
  temporaryPassword: string
  isReset?: boolean
}

export interface SendTeamCredentialsResult {
  sent: boolean
  skipped?: boolean
  message: string
}

export async function sendTeamCredentialsEmail(
  input: SendTeamCredentialsInput
): Promise<SendTeamCredentialsResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    return { sent: false, message: 'You must be signed in as the owner to send email.' }
  }

  const loginUrl = `${getActiveSiteUrl()}/admin/login`

  const { data, error } = await supabase.functions.invoke('send-team-credentials-email', {
    body: {
      toEmail: input.toEmail.trim().toLowerCase(),
      fullName: input.fullName?.trim() || null,
      temporaryPassword: input.temporaryPassword,
      isReset: Boolean(input.isReset),
      loginUrl,
    },
    headers: { Authorization: `Bearer ${session.access_token}` },
  })

  if (error) {
    const msg = error.message || ''
    if (/failed to send a request to the edge function|functionsrelayerror|404/i.test(msg)) {
      return {
        sent: false,
        skipped: true,
        message:
          'Automatic email is not set up yet. Deploy the send-team-credentials-email function and add RESEND_API_KEY in Supabase secrets.',
      }
    }
    return { sent: false, message: msg || 'Could not send email.' }
  }

  const payload = data as SendTeamCredentialsResult & { error?: string }
  if (payload?.error) {
    return { sent: false, message: payload.error }
  }

  return {
    sent: Boolean(payload?.sent),
    skipped: payload?.skipped,
    message: payload?.message ?? (payload?.sent ? 'Email sent.' : 'Email was not sent.'),
  }
}
