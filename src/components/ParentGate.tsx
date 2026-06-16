import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/components/ProtectedRoute'
import {
  hasParentPasscode,
  isValidPasscode,
  setParentPasscode,
  verifyParentPasscode,
} from '@/lib/parentPasscode'

export interface ParentGateProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

type GateMode = 'pin' | 'setup'

const PIN_LENGTH = 4

export default function ParentGate({ open, onClose, onSuccess }: ParentGateProps) {
  const { user } = useAuth()
  const [mode, setMode] = useState<GateMode>('pin')
  const [digits, setDigits] = useState<string[]>(Array(PIN_LENGTH).fill(''))
  const [confirmDigits, setConfirmDigits] = useState<string[]>(Array(PIN_LENGTH).fill(''))
  const [showPin, setShowPin] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shake, setShake] = useState(false)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [checking, setChecking] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const dialogRef = useRef<HTMLDivElement>(null)

  const resetForm = useCallback(() => {
    setDigits(Array(PIN_LENGTH).fill(''))
    setConfirmDigits(Array(PIN_LENGTH).fill(''))
    setError(null)
    setShake(false)
    setFailedAttempts(0)
  }, [])

  useEffect(() => {
    if (!open || !user) return
    resetForm()
    setChecking(true)
    hasParentPasscode(user.id)
      .then((has) => setMode(has ? 'pin' : 'setup'))
      .finally(() => setChecking(false))
  }, [open, user?.id, resetForm])

  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => inputRefs.current[0]?.focus(), 50)
    return () => window.clearTimeout(timer)
  }, [open, mode, checking])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open || !dialogRef.current) return
    const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || focusable.length === 0) return
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        }
      } else if (document.activeElement === last) {
        e.preventDefault()
        first?.focus()
      }
    }

    document.addEventListener('keydown', trap)
    return () => document.removeEventListener('keydown', trap)
  }, [open, mode, checking])

  const triggerShake = () => {
    setShake(true)
    window.setTimeout(() => setShake(false), 500)
  }

  const handleDigitChange = (
    index: number,
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    current: string[]
  ) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...current]
    next[index] = digit
    setter(next)
    setError(null)
    if (digit && index < PIN_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
    current: string[]
  ) => {
    if (e.key === 'Backspace' && !current[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const pinValue = digits.join('')
  const confirmValue = confirmDigits.join('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (mode === 'setup') {
      if (!isValidPasscode(pinValue)) {
        setError('PIN must be exactly 4 digits.')
        triggerShake()
        return
      }
      if (pinValue !== confirmValue) {
        setError('PINs do not match.')
        triggerShake()
        return
      }
      setSubmitting(true)
      try {
        await setParentPasscode(pinValue)
        onSuccess()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not save PIN.')
        triggerShake()
      } finally {
        setSubmitting(false)
      }
      return
    }

    if (!isValidPasscode(pinValue)) {
      setError('Enter your 4-digit PIN.')
      triggerShake()
      return
    }

    setSubmitting(true)
    try {
      const ok = await verifyParentPasscode(user.id, pinValue)
      if (!ok) {
        const attempts = failedAttempts + 1
        setFailedAttempts(attempts)
        setError('Incorrect PIN. Please try again.')
        triggerShake()
        setDigits(Array(PIN_LENGTH).fill(''))
        inputRefs.current[0]?.focus()
        return
      }
      onSuccess()
    } finally {
      setSubmitting(false)
    }
  }

  if (!open || !user) return null

  const renderPinRow = (
    values: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    idPrefix: string
  ) => (
    <div className="flex justify-center gap-3">
      {values.map((d, i) => (
        <input
          key={`${idPrefix}-${i}`}
          ref={(el) => {
            inputRefs.current[i] = el
          }}
          type={showPin ? 'text' : 'password'}
          inputMode="numeric"
          autoComplete="off"
          maxLength={1}
          value={d}
          aria-label={`PIN digit ${i + 1}`}
          onChange={(e) => handleDigitChange(i, e.target.value, setter, values)}
          onKeyDown={(e) => handleKeyDown(i, e, values)}
          className="w-14 h-14 text-center text-2xl font-extrabold text-[#1B2F5E] border-2 border-gray-200 rounded-xl focus:border-[#F5A623] focus:outline-none"
        />
      ))}
    </div>
  )

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="presentation"
    >
      <div className="absolute inset-0 bg-[#1B2F5E]/70" onClick={onClose} aria-hidden />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="parent-gate-title"
        className={`relative w-full max-w-[360px] bg-white rounded-[20px] p-10 shadow-xl ${shake ? 'animate-shake' : ''}`}
      >
        <p className="text-center text-3xl mb-4" aria-hidden>
          🔒
        </p>
        <h2
          id="parent-gate-title"
          className="font-display text-2xl font-bold text-[#1B2F5E] text-center mb-2"
        >
          {mode === 'setup' ? 'Set Up PIN' : 'Parent Area'}
        </h2>
        <p className="text-[#6B7280] text-sm text-center mb-6 leading-relaxed">
          {mode === 'setup'
            ? 'Create a 4-digit PIN to protect the parent area.'
            : 'Enter your 4-digit PIN to continue'}
        </p>

        {checking ? (
          <p className="text-center text-sm text-[#6B7280] py-8">Loading…</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'setup' ? (
              <>
                <div>
                  <p className="text-xs font-bold text-[#6B7280] mb-2 text-center">Choose PIN</p>
                  {renderPinRow(digits, setDigits, 'pin')}
                </div>
                <div>
                  <p className="text-xs font-bold text-[#6B7280] mb-2 text-center">Confirm PIN</p>
                  {renderPinRow(confirmDigits, setConfirmDigits, 'confirm')}
                </div>
              </>
            ) : (
              renderPinRow(digits, setDigits, 'pin')
            )}

            <button
              type="button"
              onClick={() => setShowPin((v) => !v)}
              className="w-full text-xs font-bold text-[#6B7280] hover:text-[#1B2F5E]"
            >
              {showPin ? 'Hide PIN' : 'Show PIN'}
            </button>

            {error && (
              <p className="text-sm text-red-600 font-semibold text-center" role="alert">
                {error}
              </p>
            )}

            {failedAttempts >= 3 && mode === 'pin' && (
              <p className="text-center text-sm">
                <Link to="/parent/settings" onClick={onClose} className="text-[#2AAFA0] font-bold hover:underline">
                  Forgot PIN?
                </Link>
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-[#F5A623] text-white rounded-full text-base font-extrabold hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? 'Verifying…' : mode === 'setup' ? 'Save PIN' : 'Confirm'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 border-2 border-gray-200 text-[#6B7280] rounded-full text-base font-bold hover:bg-gray-50"
            >
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
