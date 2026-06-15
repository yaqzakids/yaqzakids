import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthPageShell from '@/components/navigation/AuthPageShell'
import { completeAdminPasswordChange } from '@/lib/admin/adminLogin'
import {
  checkIsActiveAdmin,
  checkMustChangePassword,
  isMainAdminEmail,
  linkAdminUserAccount,
} from '@/lib/admin/adminUsers'
import { supabase, isSupabaseReady, SUPABASE_CONFIG_ERROR } from '@/lib/supabase'
import { formatAuthError } from '@/lib/supabaseConfig'
import PageSeo from '@/components/seo/PageSeo'

export default function AdminChangePasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const verify = async () => {
      if (!isSupabaseReady()) {
        setError(SUPABASE_CONFIG_ERROR)
        setChecking(false)
        return
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        navigate('/admin/login', { replace: true })
        return
      }

      await linkAdminUserAccount()
      const isAdmin = await checkIsActiveAdmin()
      if (!isAdmin) {
        await supabase.auth.signOut()
        navigate('/admin/login', { replace: true })
        return
      }

      const mustChange = await checkMustChangePassword()
      if (!mustChange || isMainAdminEmail(user.email)) {
        navigate('/admin', { replace: true })
        return
      }

      setChecking(false)
    }

    void verify()
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await completeAdminPasswordChange(password, navigate)
    } catch (err) {
      setError(formatAuthError(err, 'Could not update password. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <AuthPageShell>
        <PageSeo title="Change Password" noIndex path="/admin/change-password" />
        <p className="text-muted">Loading…</p>
      </AuthPageShell>
    )
  }

  return (
    <AuthPageShell>
      <PageSeo title="Change Password" noIndex path="/admin/change-password" />
      <div className="bg-white rounded-[20px] p-8 md:p-12 max-w-[420px] w-full shadow-lg">
        <h1 className="font-display text-[28px] font-bold text-navy text-center mb-1">Set a new password</h1>
        <p className="text-muted text-center mb-6">
          For security, choose a new password before accessing the admin dashboard.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-center text-coral">{error}</p>}

          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full px-4 py-3 border-[1.5px] border-gray-200 rounded-xl focus:border-teal focus:outline-none transition-colors"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full px-4 py-3 border-[1.5px] border-gray-200 rounded-xl focus:border-teal focus:outline-none transition-colors"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gold text-white rounded-full text-base font-extrabold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Update password'}
          </button>
        </form>

        <p className="text-center mt-5">
          <Link to="/admin/login" className="text-teal font-semibold hover:opacity-80">
            Back to sign in
          </Link>
        </p>
      </div>
    </AuthPageShell>
  )
}
