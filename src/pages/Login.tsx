import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthPageShell from '@/components/navigation/AuthPageShell'
import { authUrl, resolveAuthRedirect } from '@/lib/navigation'
import { navigateAfterAuth } from '@/lib/postLoginRedirect'
import { supabase, isSupabaseReady, SUPABASE_CONFIG_ERROR } from '../lib/supabase'
import { formatAuthError } from '@/lib/supabaseConfig'
import PageSeo from '@/components/seo/PageSeo'
import { PAGE_SEO_PRESETS } from '@/lib/seo/siteSeo'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = resolveAuthRedirect(
    location.search,
    (location.state as { from?: unknown } | null)?.from
  )

  useEffect(() => {
    const raw = new URLSearchParams(location.search).get('redirectTo')
    if (raw === '/admin' || redirectTo === '/admin') {
      navigate('/admin/login', { replace: true })
    }
  }, [location.search, redirectTo, navigate])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      await navigateAfterAuth(session.user.id, navigate, redirectTo, session.user)
    }
    void checkSession()
  }, [navigate, redirectTo])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError

      if (data.user) {
        await navigateAfterAuth(data.user.id, navigate, redirectTo, data.user)
      }
    } catch (err) {
      setError(formatAuthError(err, 'Login failed. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    const callback = redirectTo
      ? `${window.location.origin}/login?redirectTo=${encodeURIComponent(redirectTo)}`
      : `${window.location.origin}/login`
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callback },
    })
  }

  return (
    <AuthPageShell>
      <PageSeo {...PAGE_SEO_PRESETS.login} path="/login" />
      <div className="bg-white rounded-[20px] p-8 md:p-12 max-w-[420px] w-full shadow-lg">
        <h1 className="font-display text-[28px] font-bold text-navy text-center mb-1">Welcome back</h1>
        <p className="text-muted text-center mb-6">Sign in to your parent account</p>

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-2.5 py-3 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors mb-5"
        >
          <span>G</span> Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-muted font-bold">OR</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && <p className="text-sm text-center text-coral">{error}</p>}

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 border-[1.5px] border-gray-200 rounded-xl focus:border-teal focus:outline-none transition-colors"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 border-[1.5px] border-gray-200 rounded-xl focus:border-teal focus:outline-none transition-colors"
          />

          <p className="text-right">
            <Link
              to={authUrl('/forgot-password', redirectTo)}
              className="text-teal text-[13px] font-semibold hover:opacity-80"
            >
              Forgot password?
            </Link>
          </p>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gold text-white rounded-full text-base font-extrabold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center mt-5">
          <Link to={authUrl('/signup', redirectTo)} className="text-teal font-semibold hover:opacity-80">
            New to Yaqza Kids? Create your free account →
          </Link>
        </p>

        <p className="text-center mt-4 text-[13px] text-muted">
          Team member?{' '}
          <Link to="/admin/login" className="text-teal font-semibold hover:opacity-80">
            Admin sign in
          </Link>
        </p>
      </div>
    </AuthPageShell>
  )
}
