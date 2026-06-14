import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthPageShell from '@/components/navigation/AuthPageShell'
import PasswordCreateFields from '@/components/auth/PasswordCreateFields'
import { isPasswordValid, passwordsMatch, validateNewPassword } from '@/lib/auth/passwordPolicy'
import { setRecoveredPassword } from '@/lib/auth/changePassword'
import { hasAuthCallbackInUrl, waitForAuthSessionFromUrl } from '@/lib/auth/authCallback'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [checking, setChecking] = useState(true)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    let active = true

    const init = async () => {
      if (hasAuthCallbackInUrl()) {
        const session = await waitForAuthSessionFromUrl()
        if (!active) return
        if (session) {
          window.history.replaceState({}, document.title, '/reset-password')
          setReady(true)
          setChecking(false)
          return
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!active) return
      setReady(Boolean(session))
      setChecking(false)
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setReady(Boolean(session))
        setChecking(false)
      }
    })

    void init()

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const canSubmit =
    isPasswordValid(password) && passwordsMatch(password, confirmPassword) && !loading

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = validateNewPassword(password, confirmPassword)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError(null)
    try {
      await setRecoveredPassword(password, confirmPassword)
      await supabase.auth.signOut()
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthPageShell>
      <div className="bg-white rounded-[20px] p-8 md:p-12 max-w-[420px] w-full shadow-lg">
        <h1 className="font-display text-[28px] font-bold text-navy text-center mb-1">Choose a new password</h1>
        <p className="text-muted text-center mb-6">
          Create a strong password for your Yaqza Kids account.
        </p>

        {checking ? (
          <p className="text-muted text-center">Verifying reset link…</p>
        ) : success ? (
          <div className="text-center space-y-4">
            <p className="text-navy font-semibold">Your password has been updated.</p>
            <Link to="/login" className="text-teal font-semibold hover:opacity-80">
              Sign in with your new password →
            </Link>
          </div>
        ) : !ready ? (
          <div className="text-center space-y-4">
            <p className="text-coral text-sm font-semibold">
              This reset link is invalid or has expired.
            </p>
            <Link to="/forgot-password" className="text-teal font-semibold hover:opacity-80">
              Request a new reset link →
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-coral text-sm text-center">{error}</p>}
            <PasswordCreateFields
              password={password}
              confirmPassword={confirmPassword}
              onPasswordChange={setPassword}
              onConfirmPasswordChange={setConfirmPassword}
              passwordPlaceholder="New password"
              confirmPlaceholder="Confirm new password"
            />
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full py-3.5 bg-gold text-white rounded-full text-base font-extrabold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Saving…' : 'Update password'}
            </button>
          </form>
        )}

        {!checking && !success && (
          <p className="text-center mt-5">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-teal font-semibold hover:opacity-80 bg-transparent border-0 cursor-pointer"
            >
              ← Back to sign in
            </button>
          </p>
        )}
      </div>
    </AuthPageShell>
  )
}
