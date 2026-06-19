import { FormEvent, useEffect, useState } from 'react'
import { adminInput, adminTextarea, adminBtn } from '@/lib/admin/styles'
import { CONVERSATION_CATEGORIES, type ConversationCategory } from '@/lib/messaging/constants'
import { fetchChildrenForParent, searchParentsForMessage } from '@/lib/admin/messaging'

interface ParentOption {
  id: string
  full_name: string
  email: string | null
}

interface AdminNewMessageModalProps {
  open: boolean
  composing: boolean
  onClose: () => void
  onSend: (payload: {
    recipientId: string
    childProfileId: string | null
    subject: string
    message: string
    category: ConversationCategory
  }) => Promise<void>
}

export default function AdminNewMessageModal({
  open,
  composing,
  onClose,
  onSend,
}: AdminNewMessageModalProps) {
  const [search, setSearch] = useState('')
  const [parents, setParents] = useState<ParentOption[]>([])
  const [selectedParent, setSelectedParent] = useState<ParentOption | null>(null)
  const [children, setChildren] = useState<{ id: string; name: string; age_group: string }[]>([])
  const [childProfileId, setChildProfileId] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [category, setCategory] = useState<ConversationCategory>('general')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => {
      void searchParentsForMessage(search).then(setParents)
    }, 200)
    return () => clearTimeout(timer)
  }, [search, open])

  useEffect(() => {
    if (!selectedParent) {
      setChildren([])
      setChildProfileId('')
      return
    }
    void fetchChildrenForParent(selectedParent.id).then(setChildren)
  }, [selectedParent])

  if (!open) return null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!selectedParent) {
      setError('Select a parent recipient before sending.')
      return
    }
    await onSend({
      recipientId: selectedParent.id,
      childProfileId: childProfileId || null,
      subject,
      message,
      category,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(9, 38, 74, 0.45)' }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="font-bold text-[#1B2F5E] m-0 mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
          New Message
        </h3>
        <p className="text-xs text-gray-500 m-0 mb-4">Send a direct message to one parent. Recipient is required.</p>

        {error && <p className="text-sm text-red-600 font-semibold mb-3">{error}</p>}

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Recipient</label>
            <input
              style={adminInput}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
            />
            {selectedParent && (
              <div className="mt-2 p-3 rounded-lg bg-[#EEF4FF] border border-[#E2EBF8]">
                <p className="font-bold text-sm text-[#1B2F5E] m-0">{selectedParent.full_name}</p>
                <p className="text-xs text-[#2AAFA0] m-0">{selectedParent.email ?? 'No email'}</p>
                <button
                  type="button"
                  className="text-xs text-gray-500 mt-1 border-0 bg-transparent cursor-pointer p-0"
                  onClick={() => setSelectedParent(null)}
                >
                  Change recipient
                </button>
              </div>
            )}
            {!selectedParent && parents.length > 0 && (
              <ul className="mt-2 border border-gray-200 rounded-lg max-h-36 overflow-y-auto m-0 p-0 list-none">
                {parents.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm border-0 bg-white hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
                      onClick={() => {
                        setSelectedParent(p)
                        setSearch('')
                      }}
                    >
                      <span className="font-bold">{p.full_name}</span>
                      <span className="text-gray-500 ml-2 text-xs">{p.email}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {children.length > 0 && (
            <div>
              <label className="block text-sm font-semibold mb-1">Related child (optional)</label>
              <select
                style={adminInput}
                value={childProfileId}
                onChange={(e) => setChildProfileId(e.target.value)}
              >
                <option value="">No specific child</option>
                {children.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.age_group})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-1">Category</label>
            <select
              style={adminInput}
              value={category}
              onChange={(e) => setCategory(e.target.value as ConversationCategory)}
            >
              {CONVERSATION_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Subject</label>
            <input
              style={adminInput}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Message</label>
            <textarea
              style={adminTextarea}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" style={adminBtn.secondary} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" style={adminBtn.primary} disabled={composing || !selectedParent}>
              {composing ? 'Sending…' : 'Send Message'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
