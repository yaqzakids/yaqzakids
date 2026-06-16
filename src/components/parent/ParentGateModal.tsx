import { useEffect, useState } from 'react'
import { useAuth } from '@/components/ProtectedRoute'
import {
  hasParentPasscode,
  isValidPasscode,
  setParentPasscode,
  verifyParentPasscode,
} from '@/lib/parentPasscode'
import { supabase } from '@/lib/supabase'

type GateMode = 'passcode' | 'setup' | 'password'

interface ParentGateModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  returnPath?: string | null
  title?: string
  description?: string
}

export default function ParentGateModal({
  open,
  onClose,
  onSuccess,
  title,
  description,
}: ParentGateModalProps) {
  const { user } = useAuth()
  const [mode, setMode] = useState<GateMode>('passcode')
  const [passcode, setPasscode] = useState('')
  const [confirmPasscode, setConfirmPasscode] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [checkingPasscode, setCheckingPasscode] = useState(false)

  useEffect(() => {
    if (!open || !user) return
    setPasscode('')
    setConfirmPasscode('')
    setPassword('')
    setError(null)
    setCheckingPasscode(true)
    hasParentPasscode(user.id)
      .then((has) => setMode(has ? 'passcode' : 'setup'))
      .finally(() => setCheckingPasscode(false))
  }, [open, user?.id])

  if (!open || !user) return null

  const handleCancel = () => {
    onClose()
  }

  const handlePasscodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (mode === 'setup') {
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
        onSuccess()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not save passcode.')
      } finally {
        setSubmitting(false)
      }
      return
    }

    if (!isValidPasscode(passcode)) {
      setError('Passcode must be exactly 4 digits.')
      return
    }

    setSubmitting(true)
    try {
      const ok = await verifyParentPasscode(user.id, passcode)
      if (!ok) {
        setError('Incorrect passcode. Please try again.')
        return
      }
      onSuccess()
    } finally {
      setSubmitting(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user.email) {
      setError('No email on account for password verification.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password,
      })
      if (signInError) {
        setError('Incorrect password.')
        return
      }
      onSuccess()
    } finally {
      setSubmitting(false)
    }
  }

  const heading =
    title ?? (mode === 'setup' ? 'Create your parent passcode' : 'Parent Area Locked')
  const body =
    description ??
    (mode === 'setup'
      ? 'Set a 4-digit passcode to protect billing, subscription, and account settings.'
      : 'Enter your 4-digit parent passcode to continue.')

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="parent-gate-title"
    >
      <div className="absolute inset-0 bg-[#1B2F5E]/60" onClick={handleCancel} aria-hidden />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 md:p-8">
        <p className="text-[#2AAFA0] text-xs font-extrabold tracking-widest uppercase mb-2">
          Parent only
        </p>
        <h2 id="parent-gate-title" className="font-display text-2xl font-bold text-[#1B2F5E] mb-2">
          {heading}
        </h2>
        <p className="text-[#6B7280] text-sm mb-6 leading-relaxed">{body}</p>

        {checkingPasscode ? (
          <p className="text-sm text-[#6B7280] text-center py-6">Loading…</p>
        ) : mode === 'password' ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <input
              type="password"
              autoComplete="current-password"
              placeholder="Account password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#2AAFA0] focus:outline-none"
            />
            {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 py-3 border border-gray-200 rounded-full font-bold text-[#6B7280]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 bg-[#2AAFA0] text-white rounded-full font-extrabold disabled:opacity-50"
              >
                {submitting ? 'Verifying…' : 'Verify'}
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setMode('passcode')
                setError(null)
              }}
              className="w-full text-sm font-bold text-[#2AAFA0] hover:underline"
            >
              Use passcode instead
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasscodeSubmit} className="space-y-4">
            <input
              type="password"
              inputMode="numeric"
              autoComplete="off"
              placeholder={mode === 'setup' ? 'Choose 4-digit passcode' : 'Parent passcode'}
              value={passcode}
              onChange={(e) => setPasscode(e.target.value.replace(/\D/g, '').slice(0, 4))}
              required
              maxLength={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#2AAFA0] focus:outline-none tracking-[0.5em] text-center text-lg"
            />
            {mode === 'setup' && (
              <input
                type="password"
                inputMode="numeric"
                autoComplete="off"
                placeholder="Confirm passcode"
                value={confirmPasscode}
                onChange={(e) => setConfirmPasscode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                required
                maxLength={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#2AAFA0] focus:outline-none tracking-[0.5em] text-center text-lg"
              />
            )}
            {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 py-3 border border-gray-200 rounded-full font-bold text-[#6B7280]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 bg-[#2AAFA0] text-white rounded-full font-extrabold disabled:opacity-50"
              >
                {submitting ? 'Verifying…' : mode === 'setup' ? 'Save passcode' : 'Continue'}
              </button>
            </div>
            {mode === 'passcode' && (
              <button
                type="button"
                onClick={() => {
                  setMode('password')
                  setError(null)
                }}
                className="w-full text-sm font-bold text-[#2AAFA0] hover:underline"
              >
                Verify with password instead
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
