import { FormEvent, useEffect, useState } from 'react'
import { useAuth } from '@/components/ProtectedRoute'
import ErrorMessage from '@/components/ErrorMessage'
import {
  createAnnouncement,
  deleteAnnouncement,
  fetchAnnouncements,
  updateAnnouncement,
} from '@/lib/admin/announcements'
import { adminBtn, adminCard, adminInput, adminTableTd, adminTableTh, adminTextarea } from '@/lib/admin/styles'
import { TableSkeleton } from '@/components/admin/AdminSkeleton'
import { ANNOUNCEMENT_AUDIENCES, type AnnouncementAudience } from '@/lib/messaging/constants'
import type { AnnouncementRow } from '@/lib/messaging/types'
import { formatDateTime } from '@/lib/admin/utils'
import { formatSupabaseError } from '@/lib/supabaseErrors'

export default function AdminAnnouncementsPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState<AnnouncementRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [audience, setAudience] = useState<AnnouncementAudience>('everyone')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      setRows(await fetchAnnouncements())
    } catch (err) {
      setError(formatSupabaseError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    try {
      await createAnnouncement(user.id, { title, message, audience })
      setTitle('')
      setMessage('')
      setAudience('everyone')
      await load()
    } catch (err) {
      setError(formatSupabaseError(err))
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (row: AnnouncementRow) => {
    try {
      await updateAnnouncement(row.id, { is_active: !row.is_active })
      await load()
    } catch (err) {
      setError(formatSupabaseError(err))
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this announcement?')) return
    try {
      await deleteAnnouncement(id)
      await load()
    } catch (err) {
      setError(formatSupabaseError(err))
    }
  }

  return (
    <div>
      {error && <ErrorMessage message={error} onRetry={() => void load()} />}

      <div style={{ ...adminCard, marginBottom: 16 }}>
        <h3 className="font-bold mb-3 m-0" style={{ fontFamily: 'Playfair Display, serif', color: '#1B2F5E' }}>
          Create Announcement
        </h3>
        <form onSubmit={(e) => void handleCreate(e)} className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-4xl">
          <div>
            <label className="block text-sm font-semibold mb-1">Title</label>
            <input style={adminInput} value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Audience</label>
            <select style={adminInput} value={audience} onChange={(e) => setAudience(e.target.value as AnnouncementAudience)}>
              {ANNOUNCEMENT_AUDIENCES.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold mb-1">Message</label>
            <textarea style={adminTextarea} value={message} onChange={(e) => setMessage(e.target.value)} required />
          </div>
          <div>
            <button type="submit" style={adminBtn.primary} disabled={saving}>
              {saving ? 'Publishing…' : 'Publish Announcement'}
            </button>
          </div>
        </form>
        <p className="text-xs text-gray-500 mt-3 mb-0">
          Announcements appear pinned on the parent dashboard and messages inbox until dismissed.
        </p>
      </div>

      <div style={{ ...adminCard, padding: 0, overflow: 'auto' }}>
        {loading ? (
          <TableSkeleton rows={4} cols={5} />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
            <thead>
              <tr>
                {['Title', 'Audience', 'Status', 'Created', 'Actions'].map((h) => (
                  <th key={h} style={adminTableTh}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td style={adminTableTd}>
                    <div className="font-semibold">{row.title}</div>
                    <div className="text-xs text-gray-500 line-clamp-2">{row.message}</div>
                  </td>
                  <td style={adminTableTd}>{row.audience}</td>
                  <td style={adminTableTd}>{row.is_active ? 'Active' : 'Inactive'}</td>
                  <td style={adminTableTd}>{formatDateTime(row.created_at)}</td>
                  <td style={adminTableTd}>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" style={adminBtn.secondary} onClick={() => void toggleActive(row)}>
                        {row.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button type="button" style={adminBtn.danger} onClick={() => void handleDelete(row.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
