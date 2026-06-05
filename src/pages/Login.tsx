import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, getProfile } from '../lib/supabase'
import { IMAGES } from '../lib/constants'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError

      if (data.user) {
        const profile = await getProfile(data.user.id)
        if (profile?.role === 'admin') {
          navigate('/dashboard')
        } else {
          navigate('/dashboard')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/dashboard' } })
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 page-transition">
      <div className="bg-white rounded-[20px] p-8 md:p-12 max-w-[420px] w-full shadow-lg">
        <img src={IMAGES.logo} alt="Yaqza Kids" className="h-20 block mx-auto mb-6" />
        <h1 className="font-display text-[28px] font-bold text-navy text-center mb-1">Welcome back</h1>
        <p className="text-muted text-center mb-6">Sign in to your account</p>

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
          {error && <p className="text-coral text-sm text-center">{error}</p>}

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
            <a href="#" className="text-teal text-[13px] font-semibold hover:opacity-80">Forgot password?</a>
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
          <Link to="/signup" className="text-teal font-semibold hover:opacity-80">
            New to Yaqza Kids? Create your free account →
          </Link>
        </p>
      </div>
    </div>
  )
}
