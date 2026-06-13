import { FormEvent, useEffect, useState } from 'react'
import ErrorMessage from '@/components/ErrorMessage'
import {
  BROADCAST_AUDIENCES,
  BROADCAST_TYPES,
  broadcastTypeLabel,
  type BroadcastAudience,
  type BroadcastType,
} from '@/lib/messaging/constants'
import {
  deleteBroadcastDraft,
  fetchBroadcastDrafts,
  fetchRecentBroadcasts,
  saveBroadcastDraft,
  sendBroadcast,
} from '@/lib/admin/broadcasts'
import { adminBtn, adminCard, adminColors, adminInput, adminTextarea } from '@/lib/admin/styles'
import type { BroadcastRow } from '@/lib/messaging/types'
import { formatDateTime } from '@/lib/admin/utils'
import { formatSupabaseError } from '@/lib/supabaseErrors'
import { useAuth } from '@/components/ProtectedRoute'

interface BroadcastComposeModalProps {
  open: boolean
  initialType?: BroadcastType | null
  draft?: BroadcastRow | null
  onClose: () => void
  onSaved: () => void
}

export function BroadcastComposeModal({
  open,
  initialType,
  draft,
  onClose,
  onSaved,
}: BroadcastComposeModalProps) {
  const { user } = useAuth()
  const preset = BROADCAST_TYPES.find((t) => t.value === (initialType ?? draft?.broadcast_type))

  const [broadcastType, setBroadcastType] = useState<BroadcastType>(
    draft?.broadcast_type ?? initialType ?? 'feature'
  )
  const [title, setTitle] = useState(draft?.title ?? preset?.presetTitle ?? '')
  const [message, setMessage] = useState(draft?.message ?? preset?.presetMessage ?? '')
  const [audience, setAudience] = useState<BroadcastAudience>(draft?.audience ?? 'all')
  const [draftId, setDraftId] = useState<string | null>(draft?.id ?? null)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const type = draft?.broadcast_type ?? initialType ?? 'feature'
    const typePreset = BROADCAST_TYPES.find((t) => t.value === type)
    setBroadcastType(type)
    setTitle(draft?.title ?? typePreset?.presetTitle ?? '')
    setMessage(draft?.message ?? typePreset?.presetMessage ?? '')
    setAudience(draft?.audience ?? 'all')
    setDraftId(draft?.id ?? null)
    setError(null)
  }, [open, initialType, draft])

  const handleTypeChange = (type: BroadcastType) => {
    setBroadcastType(type)
    const typePreset = BROADCAST_TYPES.find((t) => t.value === type)
    if (!draftId && typePreset) {
      setTitle(typePreset.presetTitle)
      setMessage(typePreset.presetMessage)
    }
  }

  const buildInput = () => ({
    broadcastType,
    title,
    message,
    audience,
    draftId,
  })

  const handleSaveDraft = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setError(null)
    try {
      const saved = await saveBroadcastDraft(user.id, buildInput())
      setDraftId(saved.id)
      onSaved()
    } catch (err) {
      setError(formatSupabaseError(err))
    } finally {
      setSaving(false)
    }
  }

  const handleSend = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!window.confirm('Send this broadcast to matching families? This cannot be undone.')) return
    setSending(true)
    setError(null)
    try {
      await sendBroadcast(user.id, buildInput())
      onSaved()
      onClose()
    } catch (err) {
      setError(formatSupabaseError(err))
    } finally {
      setSending(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(9, 38, 74, 0.45)' }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="font-bold m-0 mb-4" style={{ fontFamily: 'Playfair Display, serif', color: adminColors.navy }}>
          Compose Broadcast
        </h3>

        {error && <ErrorMessage message={error} />}

        <form className="space-y-3">
          <div>
            <label className="block text-sm font-semibold mb-1">Broadcast Type</label>
            <select
              style={adminInput}
              value={broadcastType}
              onChange={(e) => handleTypeChange(e.target.value as BroadcastType)}
            >
              {BROADCAST_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.icon} {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Title</label>
            <input style={adminInput} value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Message</label>
            <textarea style={adminTextarea} value={message} onChange={(e) => setMessage(e.target.value)} required />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Audience</label>
            <select
              style={adminInput}
              value={audience}
              onChange={(e) => setAudience(e.target.value as BroadcastAudience)}
            >
              {BROADCAST_AUDIENCES.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>

          {draftId && (
            <p className="text-xs text-gray-500 m-0">Draft saved · ID {draftId.slice(0, 8)}…</p>
          )}

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button type="button" style={adminBtn.secondary} onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              style={adminBtn.secondary}
              disabled={saving || sending}
              onClick={(e) => void handleSaveDraft(e)}
            >
              {saving ? 'Saving…' : 'Save Draft'}
            </button>
            <button
              type="button"
              style={adminBtn.primary}
              disabled={saving || sending}
              onClick={(e) => void handleSend(e)}
            >
              {sending ? 'Sending…' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface BroadcastCenterCardProps {
  onRefreshConversations?: () => void
}

export default function BroadcastCenterCard({ onRefreshConversations }: BroadcastCenterCardProps) {
  const [drafts, setDrafts] = useState<BroadcastRow[]>([])
  const [recent, setRecent] = useState<BroadcastRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [composeOpen, setComposeOpen] = useState(false)
  const [composeType, setComposeType] = useState<BroadcastType | null>(null)
  const [editingDraft, setEditingDraft] = useState<BroadcastRow | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [draftRows, recentRows] = await Promise.all([
        fetchBroadcastDrafts(),
        fetchRecentBroadcasts(5),
      ])
      setDrafts(draftRows)
      setRecent(recentRows)
    } catch (err) {
      setError(formatSupabaseError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const openCompose = (type: BroadcastType, draft?: BroadcastRow) => {
    setComposeType(type)
    setEditingDraft(draft ?? null)
    setComposeOpen(true)
  }

  const handleClose = () => {
    setComposeOpen(false)
    setComposeType(null)
    setEditingDraft(null)
  }

  const handleSaved = () => {
    void load()
    onRefreshConversations?.()
  }

  const handleDeleteDraft = async (id: string) => {
    if (!window.confirm('Delete this draft?')) return
    try {
      await deleteBroadcastDraft(id)
      await load()
    } catch (err) {
      setError(formatSupabaseError(err))
    }
  }

  return (
    <>
      <div style={{ ...adminCard, marginBottom: 16 }}>
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold m-0 mb-1" style={{ fontFamily: 'Playfair Display, serif', color: adminColors.navy }}>
              📢 Broadcast Center
            </h3>
            <p className="text-sm text-gray-500 m-0">
              Send in-app family broadcasts. Separate from one-to-one conversations.
            </p>
          </div>
          {!loading && drafts.length > 0 && (
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: adminColors.navy,
                background: '#fffbeb',
                padding: '4px 10px',
                borderRadius: 999,
              }}
            >
              {drafts.length} draft{drafts.length === 1 ? '' : 's'}
            </span>
          )}
        </div>

        {error && <ErrorMessage message={error} onRetry={() => void load()} />}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 mb-4">
          {BROADCAST_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => openCompose(t.value)}
              style={{
                ...adminBtn.secondary,
                textAlign: 'left',
                padding: '12px 14px',
                borderRadius: 8,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                height: '100%',
              }}
            >
              <span style={{ fontSize: 20 }}>{t.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: adminColors.navy }}>{t.label}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-gray-500 m-0">Loading broadcasts…</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {drafts.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 m-0 mb-2">Drafts</h4>
                <ul className="m-0 p-0 list-none space-y-2">
                  {drafts.map((d) => (
                    <li
                      key={d.id}
                      className="flex items-center justify-between gap-2 p-2 rounded-md border border-gray-200 bg-gray-50"
                    >
                      <button
                        type="button"
                        onClick={() => openCompose(d.broadcast_type, d)}
                        className="text-left flex-1 bg-transparent border-0 cursor-pointer p-0"
                      >
                        <div className="text-sm font-semibold text-gray-900 line-clamp-1">{d.title}</div>
                        <div className="text-xs text-gray-500">
                          {broadcastTypeLabel(d.broadcast_type)} · {formatDateTime(d.updated_at)}
                        </div>
                      </button>
                      <button
                        type="button"
                        style={{ ...adminBtn.danger, padding: '4px 8px', fontSize: 12 }}
                        onClick={() => void handleDeleteDraft(d.id)}
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className={drafts.length > 0 ? '' : 'md:col-span-2'}>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 m-0 mb-2">
                Recent Sent
              </h4>
              {recent.length === 0 ? (
                <p className="text-sm text-gray-500 m-0">No broadcasts sent yet.</p>
              ) : (
                <ul className="m-0 p-0 list-none space-y-2">
                  {recent.map((b) => (
                    <li key={b.id} className="p-2 rounded-md border border-gray-100">
                      <div className="text-sm font-semibold text-gray-900 line-clamp-1">{b.title}</div>
                      <div className="text-xs text-gray-500">
                        {broadcastTypeLabel(b.broadcast_type)} · {b.audience} ·{' '}
                        {b.sent_at ? formatDateTime(b.sent_at) : '—'}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      <BroadcastComposeModal
        open={composeOpen}
        initialType={composeType}
        draft={editingDraft}
        onClose={handleClose}
        onSaved={handleSaved}
      />
    </>
  )
}
