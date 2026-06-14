import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import AuthPageShell from '@/components/navigation/AuthPageShell'
import { authUrl, resolveAuthRedirect } from '@/lib/navigation'
import { supabase } from '@/lib/supabase'
import { formatAuthError } from '@/lib/supabaseConfig'
import { passwordResetCallbackUrl } from '@/lib/auth/authCallback'

export default function ForgotPasswordPage() {
  const location = useLocation()
  const redirectTo = resolveAuthRedirect(location.search, null)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: passwordResetCallbackUrl(),
      })
      if (resetError) throw resetError
      setSent(true)
    } catch (err) {
      setError(formatAuthError(err, 'Could not send reset email.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthPageShell>
      <div className="bg-white rounded-[20px] p-8 md:p-12 max-w-[420px] w-full shadow-lg">
        <h1 className="font-display text-[28px] font-bold text-navy text-center mb-1">Reset password</h1>
        <p className="text-muted text-center mb-6">
          Enter your email and we&apos;ll send a reset link.
        </p>

        {sent ? (
          <div className="text-center space-y-4">
            <p className="text-navy font-semibold">Check your inbox for a reset link.</p>
            <p className="text-muted text-sm">
              If you don&apos;t see it, check spam or wait a minute before requesting another link.
            </p>
            <Link to={authUrl('/login', redirectTo)} className="text-teal font-semibold hover:opacity-80">
              Back to sign in →
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-coral text-sm text-center">{error}</p>}
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border-[1.5px] border-gray-200 rounded-xl focus:border-teal focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gold text-white rounded-full text-base font-extrabold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}

        <p className="text-center mt-5">
          <Link to={authUrl('/login', redirectTo)} className="text-teal font-semibold hover:opacity-80">
            ← Back to sign in
          </Link>
        </p>
      </div>
    </AuthPageShell>
  )
}
