import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/components/ProtectedRoute'
import PasswordCreateFields from '@/components/auth/PasswordCreateFields'
import ParentLayout from '@/components/layout/ParentLayout'
import Breadcrumbs from '@/components/navigation/Breadcrumbs'
import { AUTH_INPUT_CLASS } from '@/components/auth/PasswordRequirementsChecklist'
import { isPasswordValid, passwordsMatch, validateNewPassword } from '@/lib/auth/passwordPolicy'
import { changeUserPassword } from '@/lib/auth/changePassword'
import ParentPasscodeGate from '@/components/parent/ParentPasscodeGate'
import { isValidPasscode, setParentPasscode } from '@/lib/parentPasscode'

export default function ParentAccountSettingsPage() {
  const { user } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [passcode, setPasscode] = useState('')
  const [confirmPasscode, setConfirmPasscode] = useState('')
  const [passcodeLoading, setPasscodeLoading] = useState(false)
  const [passcodeMessage, setPasscodeMessage] = useState<string | null>(null)
  const [passcodeError, setPasscodeError] = useState<string | null>(null)

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

  const handlePasscodeReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasscodeError(null)
    setPasscodeMessage(null)

    if (!isValidPasscode(passcode)) {
      setPasscodeError('Passcode must be exactly 4 digits.')
      return
    }
    if (passcode !== confirmPasscode) {
      setPasscodeError('Passcodes do not match.')
      return
    }

    setPasscodeLoading(true)
    try {
      await setParentPasscode(passcode)
      setPasscode('')
      setConfirmPasscode('')
      setPasscodeMessage('Parent passcode updated successfully.')
    } catch (err) {
      setPasscodeError(err instanceof Error ? err.message : 'Could not update passcode.')
    } finally {
      setPasscodeLoading(false)
    }
  }

  return (
    <ParentPasscodeGate alwaysRequire onCancelPath="/parent/dashboard">
      <ParentLayout active="account">
      <div className="max-w-xl mx-auto px-6 md:px-10 py-10 space-y-8">
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/' },
            { label: 'Parent Dashboard', to: '/parent/dashboard' },
            { label: 'Account Settings' },
          ]}
          className="mb-2"
        />

        <div>
          <h1 className="font-display text-2xl md:text-[30px] font-bold text-navy mb-2">Account Settings</h1>
          <p className="text-muted leading-relaxed">
            Manage your parent account, password, and 4-digit parent passcode.
          </p>
          {user?.email && (
            <p className="text-sm text-muted mt-2">
              Signed in as <span className="font-bold text-navy">{user.email}</span>
            </p>
          )}
        </div>

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

        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8">
          <h2 className="font-display text-xl font-bold text-navy mb-2">Parent passcode</h2>
          <p className="text-muted text-sm mb-4 leading-relaxed">
            Reset your 4-digit passcode used to unlock billing, subscription, and account settings.
            You must know your account password to change sensitive settings.
          </p>
          <form onSubmit={handlePasscodeReset} className="space-y-4">
            {passcodeMessage && <p className="text-teal text-sm font-semibold">{passcodeMessage}</p>}
            {passcodeError && <p className="text-coral text-sm font-semibold">{passcodeError}</p>}
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="New 4-digit passcode"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className={AUTH_INPUT_CLASS}
              autoComplete="off"
            />
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="Confirm passcode"
              value={confirmPasscode}
              onChange={(e) => setConfirmPasscode(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className={AUTH_INPUT_CLASS}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={passcodeLoading}
              className="w-full py-3.5 border-2 border-navy text-navy rounded-full text-base font-extrabold hover:bg-navy/5 disabled:opacity-50"
            >
              {passcodeLoading ? 'Saving…' : 'Update passcode'}
            </button>
          </form>
        </div>

        <div className="bg-[#FFF8ED] rounded-2xl border border-[#F5A623]/30 p-6">
          <h2 className="font-display text-lg font-bold text-navy mb-2">Need help?</h2>
          <p className="text-muted text-sm mb-3">
            Forgot your password? Use the password reset flow from the sign-in page.
          </p>
          <Link to="/forgot-password" className="text-teal font-extrabold text-sm hover:underline">
            Reset password via email →
          </Link>
        </div>
      </div>
    </ParentLayout>
    </ParentPasscodeGate>
  )
}
