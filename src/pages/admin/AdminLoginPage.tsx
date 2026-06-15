import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthPageShell from '@/components/navigation/AuthPageShell'
import {
  ADMIN_FORGOT_PASSWORD_MESSAGE,
  ADMIN_LOGIN_DENIED_MESSAGE,
  completeAdminLogin,
} from '@/lib/admin/adminLogin'
import { supabase, isSupabaseReady, SUPABASE_CONFIG_ERROR } from '@/lib/supabase'
import { formatAuthError } from '@/lib/supabaseConfig'
import PageSeo from '@/components/seo/PageSeo'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accessDenied, setAccessDenied] = useState(false)

  useEffect(() => {
    if (!isSupabaseReady()) {
      setError(SUPABASE_CONFIG_ERROR)
    }
  }, [])

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.user) return

      const result = await completeAdminLogin(navigate)
      if (result === 'denied') {
        setAccessDenied(true)
        setError(ADMIN_LOGIN_DENIED_MESSAGE)
      }
    }
    void checkSession()
  }, [navigate])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setAccessDenied(false)

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError

      if (data.user) {
        const result = await completeAdminLogin(navigate)
        if (result === 'denied') {
          setAccessDenied(true)
          setError(ADMIN_LOGIN_DENIED_MESSAGE)
        }
      }
    } catch (err) {
      setError(formatAuthError(err, 'Sign in failed. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthPageShell>
      <PageSeo title="Admin & Team Sign In" noIndex path="/admin/login" />
      <div className="bg-white rounded-[20px] p-8 md:p-12 max-w-[420px] w-full shadow-lg">
        <h1 className="font-display text-[28px] font-bold text-navy text-center mb-1">
          Admin &amp; Team Sign In
        </h1>
        <p className="text-muted text-center mb-6">
          Sign in with your team credentials. Parent accounts use the public login page.
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <p className={`text-sm text-center ${accessDenied ? 'text-navy font-semibold' : 'text-coral'}`}>
              {error}
            </p>
          )}

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full px-4 py-3 border-[1.5px] border-gray-200 rounded-xl focus:border-teal focus:outline-none transition-colors"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full px-4 py-3 border-[1.5px] border-gray-200 rounded-xl focus:border-teal focus:outline-none transition-colors"
          />

          <p className="text-[13px] text-muted text-center leading-relaxed">{ADMIN_FORGOT_PASSWORD_MESSAGE}</p>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gold text-white rounded-full text-base font-extrabold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {accessDenied && (
          <p className="text-center mt-4">
            <Link to="/" className="text-teal font-semibold hover:opacity-80">
              Back to Homepage
            </Link>
          </p>
        )}
      </div>
    </AuthPageShell>
  )
}
