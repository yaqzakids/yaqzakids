import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, createProfile, createFreeSubscription } from '../lib/supabase'
import { IMAGES } from '../lib/constants'
import type { Language } from '../lib/types'

export default function Signup() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [language, setLanguage] = useState<Language>('en')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error: authError } = await supabase.auth.signUp({ email, password })
      if (authError) throw authError

      if (data.user) {
        await createProfile({
          id: data.user.id,
          full_name: fullName,
          role: 'parent',
          language,
        })
        await createFreeSubscription(data.user.id)
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 page-transition">
      <div className="bg-white rounded-[20px] p-8 md:p-12 max-w-[420px] w-full shadow-lg">
        <img src={IMAGES.logo} alt="Yaqza Kids" className="h-20 block mx-auto mb-6" />
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
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 border-[1.5px] border-gray-200 rounded-xl focus:border-teal focus:outline-none transition-colors"
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
            disabled={loading}
            className="w-full py-3.5 bg-gold text-white rounded-full text-base font-extrabold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Free Account'}
          </button>
        </form>

        <p className="text-center mt-5">
          <Link to="/login" className="text-teal font-semibold hover:opacity-80">
            Already have an account? Sign in →
          </Link>
        </p>
      </div>
    </div>
  )
}
