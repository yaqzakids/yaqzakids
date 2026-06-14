import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthPageShell from '@/components/navigation/AuthPageShell'
import { supabase } from '@/lib/supabase'
import { resolveOnboardingPath } from '@/lib/onboarding'
import {
  clearPendingVerifyEmail,
  hasAuthCallbackInUrl,
  readPendingVerifyEmail,
  verifyEmailCallbackUrl,
  waitForAuthSessionFromUrl,
} from '@/lib/auth/authCallback'

export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const [resending, setResending] = useState(false)
  const [processingCallback, setProcessingCallback] = useState(hasAuthCallbackInUrl())

  useEffect(() => {
    let active = true

    const init = async () => {
      if (hasAuthCallbackInUrl()) {
        setProcessingCallback(true)
        const session = await waitForAuthSessionFromUrl()
        if (!active) return

        if (session?.user) {
          clearPendingVerifyEmail()
          window.history.replaceState({}, document.title, '/verify-email')
          const next = await resolveOnboardingPath(session.user.id, session.user)
          if (next && next !== '/verify-email') {
            navigate(next, { replace: true })
            return
          }
          setEmail(session.user.email ?? null)
          setProcessingCallback(false)
          return
        }

        setError('We could not finish email verification. Try opening the link again or sign in.')
        setProcessingCallback(false)
      }

      const pending = readPendingVerifyEmail()
      if (pending) setEmail(pending)

      const { data } = await supabase.auth.getUser()
      if (!active) return
      setEmail(data.user?.email ?? pending ?? null)
    }

    void init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user
      if (!user) return
      clearPendingVerifyEmail()
      const next = await resolveOnboardingPath(user.id, user)
      if (next && next !== '/verify-email') {
        navigate(next, { replace: true })
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [navigate])

  const handleResend = async () => {
    const targetEmail = email ?? readPendingVerifyEmail()
    if (!targetEmail) return
    setResending(true)
    setError(null)
    setMessage(null)
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: targetEmail,
        options: { emailRedirectTo: verifyEmailCallbackUrl() },
      })
      if (resendError) throw resendError
      setMessage('Verification email sent. Check your inbox.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend email.')
    } finally {
      setResending(false)
    }
  }

  const handleCheck = async () => {
    setChecking(true)
    setError(null)
    try {
      const { data, error: refreshError } = await supabase.auth.refreshSession()
      if (refreshError) throw refreshError
      const user = data.session?.user
      if (!user) {
        setError('Sign in again after verifying your email.')
        return
      }
      clearPendingVerifyEmail()
      const next = await resolveOnboardingPath(user.id, user)
      navigate(next ?? '/onboarding/parent', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Still waiting for verification.')
    } finally {
      setChecking(false)
    }
  }

  if (processingCallback) {
    return (
      <AuthPageShell>
        <div className="bg-white rounded-[20px] p-8 md:p-12 max-w-[460px] w-full shadow-lg text-center">
          <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin-slow mx-auto mb-4" />
          <p className="text-muted">Confirming your email…</p>
        </div>
      </AuthPageShell>
    )
  }

  return (
    <AuthPageShell>
      <div className="bg-white rounded-[20px] p-8 md:p-12 max-w-[460px] w-full shadow-lg text-center">
        <p className="text-4xl mb-3" aria-hidden>
          ✉️
        </p>
        <h1 className="font-display text-[28px] font-bold text-navy mb-2">Verify your email</h1>
        <p className="text-muted leading-relaxed mb-6">
          We sent a confirmation link to{' '}
          <strong className="text-navy">{email ?? 'your email'}</strong>. Open it to continue setting up
          your Yaqza Kids account.
        </p>

        {message && <p className="text-teal text-sm font-semibold mb-4">{message}</p>}
        {error && <p className="text-coral text-sm font-semibold mb-4">{error}</p>}

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleCheck}
            disabled={checking}
            className="w-full py-3.5 bg-gold text-white rounded-full text-base font-extrabold hover:opacity-90 disabled:opacity-50"
          >
            {checking ? 'Checking…' : 'I verified my email'}
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || !email}
            className="w-full py-3 border border-gray-200 rounded-full text-sm font-bold text-navy hover:bg-gray-50 disabled:opacity-50"
          >
            {resending ? 'Sending…' : 'Resend verification email'}
          </button>
        </div>

        <p className="text-center mt-6">
          <Link to="/login" className="text-teal font-semibold hover:opacity-80">
            Back to sign in →
          </Link>
        </p>
      </div>
    </AuthPageShell>
  )
}
