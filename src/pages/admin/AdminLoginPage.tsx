import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { completeAdminLogin, ADMIN_LOGIN_DENIED_MESSAGE } from '@/lib/admin/adminLogin'
import { supabase, isSupabaseReady, SUPABASE_CONFIG_ERROR } from '@/lib/supabase'
import { formatAuthError } from '@/lib/supabaseConfig'
import PageSeo from '@/components/seo/PageSeo'
import BrandLogo from '@/components/BrandLogo'

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
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ background: '#1B2F5E' }}
    >
      <PageSeo title="Admin Sign In" noIndex path="/admin/login" />

      <div
        className="w-full bg-white shadow-xl relative"
        style={{ maxWidth: 420, borderRadius: 20, padding: 48 }}
      >
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 mb-6 p-0 border-0 bg-transparent cursor-pointer text-sm font-semibold text-[#1B2F5E] hover:text-[#0F1A33] hover:underline transition-colors"
        >
          <span aria-hidden>←</span>
          Back to Home
        </button>

        <div className="flex flex-col items-center mb-8">
          <BrandLogo height={52} />
          <p
            className="mt-4 mb-0 text-xs font-extrabold tracking-widest uppercase"
            style={{ color: '#F5A623' }}
          >
            Admin Control Center
          </p>
        </div>

        <h1
          className="text-center mb-6 m-0"
          style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 700, color: '#1B2F5E' }}
        >
          Admin Sign In
        </h1>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <p
              className={`text-sm text-center m-0 ${accessDenied ? 'font-semibold' : ''}`}
              style={{ color: accessDenied ? '#1B2F5E' : '#E85D4A' }}
            >
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
            className="w-full px-4 py-3 border-[1.5px] border-gray-200 rounded-xl focus:border-[#F5A623] focus:outline-none transition-colors"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full px-4 py-3 border-[1.5px] border-gray-200 rounded-xl focus:border-[#F5A623] focus:outline-none transition-colors"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 text-white rounded-full text-base font-extrabold hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ background: '#F5A623' }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center mt-6 mb-0 text-[13px] leading-relaxed" style={{ color: '#6B7280' }}>
          This area is restricted to authorised administrators only.
        </p>

        {accessDenied && (
          <p className="text-center mt-4 mb-0">
            <Link to="/admin/login" className="font-semibold hover:opacity-80" style={{ color: '#F5A623' }}>
              Back to Admin Login
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
