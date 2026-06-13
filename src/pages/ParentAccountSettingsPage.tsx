import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/components/ProtectedRoute'
import PasswordCreateFields from '@/components/auth/PasswordCreateFields'
import PageBackNav from '@/components/navigation/PageBackNav'
import ParentNavLinks from '@/components/messaging/ParentNavLinks'
import Breadcrumbs from '@/components/navigation/Breadcrumbs'
import { AUTH_INPUT_CLASS } from '@/components/auth/PasswordRequirementsChecklist'
import { isPasswordValid, passwordsMatch, validateNewPassword } from '@/lib/auth/passwordPolicy'
import { changeUserPassword } from '@/lib/auth/changePassword'

export default function ParentAccountSettingsPage() {
  const { user } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const canSubmit =
    currentPassword.length > 0 &&
    isPasswordValid(newPassword) &&
    passwordsMatch(newPassword, confirmPassword) &&
    !loading

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.email) {
      setError('No email on file for this account.')
      return
    }

    const validationError = validateNewPassword(newPassword, confirmPassword)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setMessage(null)
    setError(null)
    try {
      await changeUserPassword(user.email, currentPassword, newPassword, confirmPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setMessage('Password updated successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg page-transition">
      <nav className="bg-white border-b border-gray-200 px-6 md:px-10 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <Link to="/" className="font-display font-bold text-navy tracking-tight no-underline">
            YAQZA KIDS
          </Link>
          <PageBackNav fallbackTo="/parent/dashboard" homeTo="/" showHome />
        </div>
        <ParentNavLinks active="dashboard" />
      </nav>

      <div className="max-w-xl mx-auto px-6 md:px-10 py-10">
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/' },
            { label: 'Parent Dashboard', to: '/parent/dashboard' },
            { label: 'Account & Password' },
          ]}
          className="mb-6"
        />

        <h1 className="font-display text-2xl md:text-[30px] font-bold text-navy mb-2">Account & Password</h1>
        <p className="text-muted mb-8 leading-relaxed">
          Update your parent account password. Use a strong password to keep your family&apos;s account secure.
        </p>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8">
          <h2 className="font-display text-xl font-bold text-navy mb-4">Change password</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {message && <p className="text-teal text-sm font-semibold">{message}</p>}
            {error && <p className="text-coral text-sm font-semibold">{error}</p>}

            <input
              type="password"
              placeholder="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
              className={AUTH_INPUT_CLASS}
            />

            <PasswordCreateFields
              password={newPassword}
              confirmPassword={confirmPassword}
              onPasswordChange={setNewPassword}
              onConfirmPasswordChange={setConfirmPassword}
              passwordPlaceholder="New password"
              confirmPlaceholder="Confirm new password"
            />

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full py-3.5 bg-gold text-white rounded-full text-base font-extrabold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Saving…' : 'Update password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
