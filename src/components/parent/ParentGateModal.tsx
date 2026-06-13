import { useEffect, useState } from 'react'
import { useAuth } from '@/components/ProtectedRoute'
import {
  hasParentPin,
  setParentPin,
  verifyParentPin,
} from '@/lib/parentGate'
import { supabase } from '@/lib/supabase'

type GateMode = 'pin' | 'setup' | 'password'

interface ParentGateModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  returnPath?: string | null
}

export default function ParentGateModal({
  open,
  onClose,
  onSuccess,
}: ParentGateModalProps) {
  const { user } = useAuth()
  const [mode, setMode] = useState<GateMode>('pin')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open || !user) return
    setPin('')
    setConfirmPin('')
    setPassword('')
    setError(null)
    setMode(hasParentPin(user.id) ? 'pin' : 'setup')
  }, [open, user?.id])

  if (!open || !user) return null

  const handleCancel = () => {
    onClose()
  }

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (mode === 'setup') {
      if (!/^\d{4,6}$/.test(pin)) {
        setError('PIN must be 4–6 digits.')
        return
      }
      if (pin !== confirmPin) {
        setError('PINs do not match.')
        return
      }
      setParentPin(user.id, pin)
      onSuccess()
      return
    }

    if (!verifyParentPin(user.id, pin)) {
      setError('Incorrect PIN. Try again or use your password.')
      return
    }
    onSuccess()
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
          {mode === 'setup' ? 'Create a parent PIN' : 'Parent verification'}
        </h2>
        <p className="text-[#6B7280] text-sm mb-6 leading-relaxed">
          {mode === 'setup'
            ? 'Set a PIN to protect billing, settings, and the parent dashboard when a child profile is active.'
            : 'Enter your parent PIN or password to continue.'}
        </p>

        {mode === 'password' ? (
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
                setMode(hasParentPin(user.id) ? 'pin' : 'setup')
                setError(null)
              }}
              className="w-full text-sm font-bold text-[#2AAFA0] hover:underline"
            >
              Use PIN instead
            </button>
          </form>
        ) : (
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <input
              type="password"
              inputMode="numeric"
              autoComplete="off"
              placeholder={mode === 'setup' ? 'Choose a 4–6 digit PIN' : 'Parent PIN'}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#2AAFA0] focus:outline-none tracking-widest text-center text-lg"
            />
            {mode === 'setup' && (
              <input
                type="password"
                inputMode="numeric"
                autoComplete="off"
                placeholder="Confirm PIN"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#2AAFA0] focus:outline-none tracking-widest text-center text-lg"
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
                className="flex-1 py-3 bg-[#2AAFA0] text-white rounded-full font-extrabold"
              >
                {mode === 'setup' ? 'Save PIN' : 'Continue'}
              </button>
            </div>
            {mode === 'pin' && (
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
