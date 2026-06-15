import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const OWNER_EMAIL = 'hello@yaqzakids.com'

interface SendCredentialsBody {
  toEmail?: string
  fullName?: string | null
  temporaryPassword?: string
  isReset?: boolean
  loginUrl?: string
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function buildEmailHtml(params: {
  fullName: string | null
  toEmail: string
  temporaryPassword: string
  loginUrl: string
  isReset: boolean
}): string {
  const greeting = params.fullName ? `Hi ${escapeHtml(params.fullName)},` : 'Hello,'
  const intro = params.isReset
    ? 'Your Yaqza Kids admin login password was reset.'
    : 'You have been invited as a team member on the Yaqza Kids admin dashboard.'

  return `<!DOCTYPE html>
<html>
<body style="font-family:Nunito,Arial,sans-serif;line-height:1.6;color:#1B2F5E;max-width:560px;margin:0 auto;padding:24px;">
  <p style="font-family:Georgia,serif;font-size:22px;font-weight:bold;margin:0 0 16px;">Yaqza Kids — Admin access</p>
  <p>${greeting}</p>
  <p>${intro}</p>
  <p><strong>Sign in here:</strong><br><a href="${escapeHtml(params.loginUrl)}">${escapeHtml(params.loginUrl)}</a></p>
  <p><strong>Email:</strong> ${escapeHtml(params.toEmail)}</p>
  <p><strong>Temporary password:</strong></p>
  <p style="font-size:18px;font-weight:bold;background:#FEF3C7;padding:12px 16px;border-radius:8px;border:1px solid #FCD34D;">${escapeHtml(params.temporaryPassword)}</p>
  <p>On your first sign-in you will be asked to choose a new password.</p>
  <p style="color:#6B7280;font-size:13px;">If you did not expect this email, contact ${OWNER_EMAIL}.</p>
</body>
</html>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  const fromAddress = Deno.env.get('TEAM_EMAIL_FROM') ?? 'Yaqza Kids <hello@yaqzakids.com>'
  const defaultSiteUrl = Deno.env.get('SITE_URL') ?? 'https://www.yaqzakids.com'

  if (!resendApiKey) {
    return jsonResponse({
      sent: false,
      skipped: true,
      message: 'Email service is not configured. Add RESEND_API_KEY to Supabase Edge Function secrets.',
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!supabaseUrl || !anonKey) {
    return jsonResponse({ error: 'Server configuration error' }, 500)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const {
    data: { user: caller },
    error: callerError,
  } = await userClient.auth.getUser()

  if (callerError || !caller) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const callerEmail = (caller.email ?? '').trim().toLowerCase()
  if (callerEmail !== OWNER_EMAIL) {
    return jsonResponse({ error: 'Only the owner can send team credential emails' }, 403)
  }

  let body: SendCredentialsBody
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  const toEmail = (body.toEmail ?? '').trim().toLowerCase()
  const temporaryPassword = body.temporaryPassword ?? ''
  const fullName = body.fullName?.trim() || null
  const isReset = Boolean(body.isReset)
  const loginUrl = (body.loginUrl ?? `${defaultSiteUrl.replace(/\/$/, '')}/admin/login`).trim()

  if (!toEmail || !temporaryPassword) {
    return jsonResponse({ error: 'Recipient email and temporary password are required' }, 400)
  }

  const subject = isReset
    ? 'Your Yaqza Kids admin password was reset'
    : 'Your Yaqza Kids admin team login'

  const text = [
    fullName ? `Hi ${fullName},` : 'Hello,',
    '',
    isReset
      ? 'Your Yaqza Kids admin login password was reset.'
      : 'You have been invited as a team member on the Yaqza Kids admin dashboard.',
    '',
    `Sign in: ${loginUrl}`,
    `Email: ${toEmail}`,
    `Temporary password: ${temporaryPassword}`,
    '',
    'On your first sign-in you will be asked to choose a new password.',
    '',
    `Questions? Contact ${OWNER_EMAIL}.`,
  ].join('\n')

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [toEmail],
      subject,
      text,
      html: buildEmailHtml({ fullName, toEmail, temporaryPassword, loginUrl, isReset }),
    }),
  })

  if (!resendResponse.ok) {
    const detail = await resendResponse.text()
    return jsonResponse(
      {
        sent: false,
        message: `Email provider error: ${detail.slice(0, 240)}`,
      },
      502
    )
  }

  return jsonResponse({ sent: true, message: `Login details sent to ${toEmail}.` })
})
