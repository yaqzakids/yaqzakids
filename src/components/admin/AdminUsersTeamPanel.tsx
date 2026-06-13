import { useEffect, useState } from 'react'
import { useAdminRole } from '@/context/AdminRoleContext'
import {
  addAdminTeamUser,
  ADMIN_TEAM_ROLE_LABELS,
  ADMIN_TEAM_ROLE_OPTIONS,
  fetchAdminTeamUsers,
  isMainAdminEmail,
  removeAdminTeamUser,
  type AdminTeamRole,
  type AdminTeamUser,
} from '@/lib/admin/adminUsers'
import { adminBtn, adminCard, adminInput, adminTableTd, adminTableTh } from '@/lib/admin/styles'
import StatusBadge from '@/components/admin/StatusBadge'
import { formatDateTime } from '@/lib/admin/utils'

function roleBadgeVariant(role: AdminTeamRole): 'success' | 'warning' | 'muted' | 'gold' {
  if (role === 'owner') return 'gold'
  if (role === 'admin') return 'success'
  if (role === 'editor') return 'muted'
  return 'warning'
}

/** Owner-only admin team panel embedded in Settings */
export default function AdminUsersTeamPanel() {
  const { isOwner } = useAdminRole()
  const [rows, setRows] = useState<AdminTeamUser[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'editor' | 'support'>('admin')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      setRows(await fetchAdminTeamUsers())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOwner) void load()
  }, [isOwner])

  if (!isOwner) return null

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    setError(null)
    try {
      await addAdminTeamUser(email, role)
      setEmail('')
      setMessage('Admin added.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add admin.')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (row: AdminTeamUser) => {
    if (isMainAdminEmail(row.email)) return
    if (!confirm(`Remove admin access for ${row.email}?`)) return
    try {
      await removeAdminTeamUser(row.id)
      setMessage('Admin removed.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove admin.')
    }
  }

  return (
    <div style={{ ...adminCard, marginBottom: 24 }}>
      <h2 style={{ margin: '0 0 8px', fontFamily: 'Playfair Display, serif', color: '#1B2F5E' }}>
        Admin Users
      </h2>
      <p style={{ margin: '0 0 16px', color: '#6B7280', fontSize: 14, lineHeight: 1.6 }}>
        Only hello@yaqzakids.com can add or remove admins. Emails are saved before the user signs up.
      </p>

      <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 max-w-3xl mb-4">
        <input
          type="email"
          required
          placeholder="admin@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={adminInput}
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as 'admin' | 'editor' | 'support')}
          style={adminInput}
        >
          {ADMIN_TEAM_ROLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button type="submit" style={adminBtn.primary} disabled={saving}>
          {saving ? 'Adding…' : 'Add Admin'}
        </button>
      </form>

      {message && <p style={{ margin: '0 0 12px', color: '#2AAFA0', fontWeight: 700 }}>{message}</p>}
      {error && <p style={{ margin: '0 0 12px', color: '#dc2626', fontWeight: 700 }}>{error}</p>}

      {loading ? (
        <p style={{ color: '#6B7280', margin: 0 }}>Loading admin users…</p>
      ) : (
        <div style={{ overflow: 'auto' }}>
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: '#FAF8F2' }}>
                {['Email', 'Role', 'Status', 'Added', ''].map((h) => (
                  <th key={h || 'actions'} style={adminTableTh}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-[#F0EDE6]">
                  <td style={adminTableTd}>{row.email}</td>
                  <td style={adminTableTd}>
                    <StatusBadge
                      label={ADMIN_TEAM_ROLE_LABELS[row.role]}
                      variant={roleBadgeVariant(row.role)}
                    />
                  </td>
                  <td style={adminTableTd}>
                    {row.user_id ? 'Active' : 'Pending sign-in'}
                  </td>
                  <td style={adminTableTd}>{formatDateTime(row.created_at)}</td>
                  <td style={adminTableTd}>
                    {!isMainAdminEmail(row.email) && (
                      <button type="button" style={adminBtn.danger} onClick={() => handleRemove(row)}>
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
