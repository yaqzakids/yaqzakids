import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthPageShell from '@/components/navigation/AuthPageShell'
import PasswordCreateFields from '@/components/auth/PasswordCreateFields'
import { authUrl, resolveAuthRedirect } from '@/lib/navigation'
import { navigateAfterAuth } from '@/lib/postLoginRedirect'
import { isPasswordValid, passwordsMatch, validateNewPassword } from '@/lib/auth/passwordPolicy'
import { supabase } from '../lib/supabase'

export default function Signup() {
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = resolveAuthRedirect(location.search, null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit =
    email.trim().length > 0 &&
    isPasswordValid(password) &&
    passwordsMatch(password, confirmPassword) &&
    !loading

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = validateNewPassword(password, confirmPassword)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) {
        setError(authError.message)
        return
      }

      if (data.user) {
        if (!data.session) {
          navigate('/verify-email', { replace: true })
          return
        }
        await navigateAfterAuth(data.user.id, navigate, redirectTo, data.user)
      }
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : err instanceof Error
            ? err.message
            : 'Signup failed. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthPageShell>
      <div className="bg-white rounded-[20px] p-8 md:p-12 max-w-[420px] w-full shadow-lg">
        <h1 className="font-display text-[28px] font-bold text-navy text-center mb-1">Sign up</h1>
        <p className="text-muted text-center mb-6">Create your Yaqza Kids parent account</p>

        <form onSubmit={handleSignup} className="space-y-4">
          {error && <p className="text-coral text-sm text-center">{error}</p>}

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 border-[1.5px] border-gray-200 rounded-xl focus:border-teal focus:outline-none transition-colors"
          />
          <PasswordCreateFields
            password={password}
            confirmPassword={confirmPassword}
            onPasswordChange={setPassword}
            onConfirmPasswordChange={setConfirmPassword}
            passwordPlaceholder="Create a password"
            confirmPlaceholder="Confirm password"
          />

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-3.5 bg-gold text-white rounded-full text-base font-extrabold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Continue'}
          </button>
        </form>

        <p className="text-center mt-5">
          <Link to={authUrl('/login', redirectTo)} className="text-teal font-semibold hover:opacity-80">
            Already have an account? Sign in →
          </Link>
        </p>
      </div>
    </AuthPageShell>
  )
}
