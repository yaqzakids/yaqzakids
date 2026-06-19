import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthPageShell from '@/components/navigation/AuthPageShell'
import { supabase } from '@/lib/supabase'
import { redirectAfterLogin } from '@/lib/postLoginRedirect'
import {
  clearPendingVerifyEmail,
  hasAuthCallbackInUrl,
  readPendingVerifyEmail,
  shouldShowVerifyEmailPage,
  signUpEmailConfirmUrl,
  waitForAuthSessionFromUrl,
} from '@/lib/auth/authCallback'

/** Shown only right after sign-up when email confirmation is required — not part of sign-in. */
export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const allowed = shouldShowVerifyEmailPage()
  const [email, setEmail] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [resending, setResending] = useState(false)
  const [processingCallback, setProcessingCallback] = useState(
    allowed && hasAuthCallbackInUrl()
  )

  useEffect(() => {
    if (allowed) return

    let active = true
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!active) return
      if (user) {
        await redirectAfterLogin(user.id, navigate)
        return
      }
      navigate('/login', { replace: true })
    })()

    return () => {
      active = false
    }
  }, [allowed, navigate])

  useEffect(() => {
    if (!allowed) return

    let active = true

    const init = async () => {
      if (hasAuthCallbackInUrl()) {
        setProcessingCallback(true)
        const session = await waitForAuthSessionFromUrl()
        if (!active) return

        if (session?.user) {
          clearPendingVerifyEmail()
          await redirectAfterLogin(session.user.id, navigate)
          return
        }

        setError('We could not finish email verification. Try opening the link again or sign in.')
        setProcessingCallback(false)
      }

      const pending = readPendingVerifyEmail()
      if (pending) setEmail(pending)
    }

    void init()

    return () => {
      active = false
    }
  }, [allowed, navigate])

  const handleResend = async () => {
    const targetEmail = email ?? readPendingVerifyEmail()
    if (!targetEmail) {
      setError('Create your account on the sign-up page first.')
      return
    }

    setResending(true)
    setError(null)
    setMessage(null)
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: targetEmail,
        options: { emailRedirectTo: signUpEmailConfirmUrl() },
      })
      if (resendError) throw resendError
      setMessage('Verification email sent. Check your inbox and spam folder.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend email.')
    } finally {
      setResending(false)
    }
  }

  if (!allowed) {
    return (
      <AuthPageShell>
        <div className="bg-white rounded-[20px] p-8 md:p-12 max-w-[460px] w-full shadow-lg text-center">
          <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin-slow mx-auto mb-4" />
          <p className="text-muted">Redirecting…</p>
        </div>
      </AuthPageShell>
    )
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
        <h1 className="font-display text-[28px] font-bold text-navy mb-2">Check your email</h1>
        <p className="text-muted leading-relaxed mb-6">
          We sent a confirmation link to{' '}
          <strong className="text-navy">{email ?? 'your email'}</strong>. Open it to activate your
          account, then sign in.
        </p>

        {message && <p className="text-teal text-sm font-semibold mb-4">{message}</p>}
        {error && <p className="text-coral text-sm font-semibold mb-4">{error}</p>}

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => void handleResend()}
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
