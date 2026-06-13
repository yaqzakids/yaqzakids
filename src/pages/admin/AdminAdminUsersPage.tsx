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
import { CardSkeleton } from '@/components/admin/AdminSkeleton'
import StatusBadge from '@/components/admin/StatusBadge'
import { formatDateTime } from '@/lib/admin/utils'
import { supabase } from '@/lib/supabase'

function roleBadgeVariant(role: AdminTeamRole): 'success' | 'warning' | 'muted' | 'gold' {
  if (role === 'owner') return 'gold'
  if (role === 'admin') return 'success'
  if (role === 'editor') return 'muted'
  return 'warning'
}

export default function AdminAdminUsersPage() {
  const { isOwner } = useAdminRole()
  const [rows, setRows] = useState<AdminTeamUser[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'editor' | 'support'>('admin')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentEmail, setCurrentEmail] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await fetchAdminTeamUsers()
      setRows(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load admin users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentEmail(data.user?.email ?? null))
    void load()
  }, [])

  if (!isOwner) {
    return (
      <div style={adminCard}>
        <p style={{ margin: 0, color: '#6B7280' }}>
          Only the main admin ({'hello@yaqzakids.com'}) can manage admin users.
        </p>
      </div>
    )
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    setError(null)
    try {
      await addAdminTeamUser(email, role)
      setEmail('')
      setRole('admin')
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
    setError(null)
    try {
      await removeAdminTeamUser(row.id)
      setMessage('Admin removed.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove admin.')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1
          style={{
            margin: 0,
            fontFamily: 'Playfair Display, serif',
            color: '#1B2F5E',
            fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
            fontWeight: 800,
          }}
        >
          Admin Users
        </h1>
        <p style={{ margin: '8px 0 0', color: '#6B7280', maxWidth: 640, lineHeight: 1.6 }}>
          Add or remove dashboard admins by email. Only{' '}
          <strong>{currentEmail && isMainAdminEmail(currentEmail) ? 'you' : 'hello@yaqzakids.com'}</strong>{' '}
          can manage this list. Invited emails gain access after they sign in with the same address.
        </p>
      </div>

      <div style={adminCard}>
        <h2 style={{ margin: '0 0 16px', fontFamily: 'Playfair Display, serif', color: '#1B2F5E' }}>
          Add Admin
        </h2>
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 max-w-3xl">
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
        {message && <p style={{ margin: '12px 0 0', color: '#2AAFA0', fontWeight: 700 }}>{message}</p>}
        {error && <p style={{ margin: '12px 0 0', color: '#dc2626', fontWeight: 700 }}>{error}</p>}
      </div>

      {loading ? (
        <CardSkeleton count={1} />
      ) : (
        <div style={{ ...adminCard, padding: 0, overflow: 'auto' }}>
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: '#FAF8F2' }}>
                {['Email', 'Role', 'Account linked', 'Added', ''].map((h) => (
                  <th key={h || 'actions'} style={adminTableTh}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-[#F0EDE6]">
                  <td style={adminTableTd}>
                    <span style={{ fontWeight: 700, color: '#1B2F5E' }}>{row.email}</span>
                    {isMainAdminEmail(row.email) && (
                      <span style={{ marginLeft: 8, fontSize: 11, color: '#6B7280' }}>(root owner)</span>
                    )}
                  </td>
                  <td style={adminTableTd}>
                    <StatusBadge
                      label={ADMIN_TEAM_ROLE_LABELS[row.role]}
                      variant={roleBadgeVariant(row.role)}
                    />
                  </td>
                  <td style={adminTableTd}>
                    {row.user_id ? (
                      <span style={{ color: '#2AAFA0', fontWeight: 700, fontSize: 13 }}>Yes</span>
                    ) : (
                      <span style={{ color: '#6B7280', fontSize: 13 }}>Pending sign-in</span>
                    )}
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
