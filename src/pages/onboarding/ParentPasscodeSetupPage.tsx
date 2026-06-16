import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/components/ProtectedRoute'
import ParentLayout from '@/components/layout/ParentLayout'
import { isValidPasscode, setParentPasscode } from '@/lib/parentPasscode'

export default function ParentPasscodeSetupPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [passcode, setPasscode] = useState('')
  const [confirmPasscode, setConfirmPasscode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!isValidPasscode(passcode)) {
      setError('Passcode must be exactly 4 digits.')
      return
    }
    if (passcode !== confirmPasscode) {
      setError('Passcodes do not match.')
      return
    }

    setSubmitting(true)
    try {
      await setParentPasscode(passcode)
      navigate('/children/new?onboarding=1', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save passcode. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#EEF4FF] flex items-center justify-center px-6">
        <p className="text-[#1B2F5E] font-bold">
          <Link to="/login" className="text-[#2AAFA0] hover:underline">
            Sign in
          </Link>{' '}
          to continue setup.
        </p>
      </div>
    )
  }

  return (
    <ParentLayout bg="bg-[#EEF4FF]">
      <div className="max-w-md mx-auto px-6 py-12">
        <p className="text-[#2AAFA0] text-xs font-extrabold tracking-widest uppercase mb-2">Step 2 of 3</p>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-[#1B2F5E] mb-2">
          Create your parent passcode
        </h1>
        <p className="text-[#6B7280] mb-8 leading-relaxed">
          Choose a 4-digit passcode to protect billing, subscription, and account settings from your
          children.
        </p>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#E2EBF8] p-6 shadow-sm space-y-4">
          <div>
            <label htmlFor="passcode" className="block text-sm font-bold text-[#1B2F5E] mb-2">
              Parent passcode
            </label>
            <input
              id="passcode"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              value={passcode}
              onChange={(e) => setPasscode(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-center text-xl tracking-[0.5em] focus:border-[#2AAFA0] focus:outline-none"
              required
            />
          </div>
          <div>
            <label htmlFor="confirm-passcode" className="block text-sm font-bold text-[#1B2F5E] mb-2">
              Confirm passcode
            </label>
            <input
              id="confirm-passcode"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              value={confirmPasscode}
              onChange={(e) => setConfirmPasscode(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-center text-xl tracking-[0.5em] focus:border-[#2AAFA0] focus:outline-none"
              required
            />
          </div>
          {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-[#2AAFA0] text-white rounded-full font-extrabold hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Continue'}
          </button>
        </form>
      </div>
    </ParentLayout>
  )
}
