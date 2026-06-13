import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthPageShell from '@/components/navigation/AuthPageShell'
import { useAuth } from '@/components/ProtectedRoute'
import { upsertParentProfile } from '@/lib/supabase'
import type { Language } from '@/lib/types'

export default function ParentOnboardingPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [fullName, setFullName] = useState('')
  const [language, setLanguage] = useState<Language>('en')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      navigate('/login', { replace: true })
    }
  }, [authLoading, user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setError(null)
    try {
      await upsertParentProfile(user.id, fullName.trim(), language)
      navigate('/children/new?onboarding=1', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AuthPageShell>
      <div className="bg-white rounded-[20px] p-8 md:p-12 max-w-[420px] w-full shadow-lg">
        <h1 className="font-display text-[28px] font-bold text-navy text-center mb-1">Create parent account</h1>
        <p className="text-muted text-center mb-6">Tell us a little about you before adding your child.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-coral text-sm text-center">{error}</p>}

          <input
            type="text"
            placeholder="Your full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
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
            disabled={saving || !fullName.trim()}
            className="w-full py-3.5 bg-gold text-white rounded-full text-base font-extrabold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Continue'}
          </button>
        </form>
      </div>
    </AuthPageShell>
  )
}
