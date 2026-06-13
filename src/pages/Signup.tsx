import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthPageShell from '@/components/navigation/AuthPageShell'
import PasswordCreateFields from '@/components/auth/PasswordCreateFields'
import { authUrl, resolveAuthRedirect } from '@/lib/navigation'
import { navigateAfterAuth } from '@/lib/postLoginRedirect'
import { isPasswordValid, passwordsMatch, validateNewPassword } from '@/lib/auth/passwordPolicy'
import { supabase } from '../lib/supabase'
import type { Language } from '../lib/types'

export default function Signup() {
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = resolveAuthRedirect(location.search, null)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [language, setLanguage] = useState<Language>('en')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit =
    fullName.trim().length > 0 &&
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
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (authError) {
        setError(authError.message)
        return
      }

      if (data.user) {
        await navigateAfterAuth(data.user.id, navigate, redirectTo)
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
        <h1 className="font-display text-[28px] font-bold text-navy text-center mb-1">Create your free account</h1>
        <p className="text-muted text-center mb-6">Join the Yaqza Kids community</p>

        <form onSubmit={handleSignup} className="space-y-4">
          {error && <p className="text-coral text-sm text-center">{error}</p>}

          <input
            type="text"
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full px-4 py-3 border-[1.5px] border-gray-200 rounded-xl focus:border-teal focus:outline-none transition-colors"
          />
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
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="w-full px-4 py-3 border-[1.5px] border-gray-200 rounded-xl focus:border-teal focus:outline-none transition-colors bg-white"
          >
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="ar">العربية</option>
          </select>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-3.5 bg-gold text-white rounded-full text-base font-extrabold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Free Account'}
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
