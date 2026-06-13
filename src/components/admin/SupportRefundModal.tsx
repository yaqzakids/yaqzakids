import { FormEvent, useState } from 'react'
import { adminBtn, adminInput, adminTextarea } from '@/lib/admin/styles'

interface SupportRefundModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (amount: number, reason: string) => Promise<void>
}

export default function SupportRefundModal({ open, onClose, onSubmit }: SupportRefundModalProps) {
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const parsed = Number(amount)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError('Enter a valid refund amount.')
      return
    }
    if (!reason.trim()) {
      setError('Reason is required.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await onSubmit(parsed, reason.trim())
      setAmount('')
      setReason('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save refund request.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(9, 38, 74, 0.45)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="refund-modal-title"
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 id="refund-modal-title" className="font-bold text-navy m-0 mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
          Issue Refund Request
        </h3>
        <p className="text-sm text-gray-500 mb-4 mt-0">
          This records a refund request only. Stripe is not connected yet.
        </p>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Refund Amount ($)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              style={adminInput}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Reason</label>
            <textarea
              style={adminTextarea}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this refund being issued?"
              required
            />
          </div>
          {error && <p className="text-sm text-red-600 m-0">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" style={adminBtn.secondary} onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" style={adminBtn.primary} disabled={submitting}>
              {submitting ? 'Saving…' : 'Save Refund Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
