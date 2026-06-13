import { Fragment, useEffect, useMemo, useState } from 'react'
import {
  deleteUser,
  fetchAdminUsers,
  fetchUserChildren,
  setUserSuspended,
  updateUserNotes,
  updateUserRole,
  type AdminUserChild,
  type AdminUserRow,
} from '@/lib/admin/users'
import { adminBtn, adminCard, adminInput, adminTableTd, adminTableTh } from '@/lib/admin/styles'
import { TableSkeleton } from '@/components/admin/AdminSkeleton'
import EmptyState from '@/components/admin/EmptyState'
import StatusBadge from '@/components/admin/StatusBadge'
import { formatDate } from '@/lib/admin/utils'
import type { UserRole } from '@/lib/types'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [children, setChildren] = useState<AdminUserChild[]>([])
  const [notes, setNotes] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchAdminUsers().then((u) => {
      setUsers(u)
      setNotes(Object.fromEntries(u.map((x) => [x.id, x.admin_notes ?? ''])))
    }).finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return users
    return users.filter((u) =>
      u.full_name.toLowerCase().includes(q) ||
      (u.email?.toLowerCase().includes(q) ?? false)
    )
  }, [users, search])

  const expand = async (userId: string) => {
    if (expandedId === userId) {
      setExpandedId(null)
      return
    }
    setExpandedId(userId)
    setChildren(await fetchUserChildren(userId))
  }

  const handleRole = async (userId: string, role: UserRole) => {
    await updateUserRole(userId, role)
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)))
  }

  const handleSuspend = async (userId: string, suspended: boolean) => {
    await setUserSuspended(userId, suspended)
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, suspended } : u)))
  }

  const handleNotes = async (userId: string) => {
    await updateUserNotes(userId, notes[userId] ?? '')
  }

  const handleDelete = async (userId: string, name: string) => {
    if (!confirm(`Delete account for "${name}"? All child profiles will be removed.`)) return
    await deleteUser(userId)
    setUsers((prev) => prev.filter((u) => u.id !== userId))
    setExpandedId(null)
  }

  return (
    <div>
      <input placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...adminInput, maxWidth: 320, marginBottom: 16 }} />

      {loading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : filtered.length === 0 ? (
        <div style={adminCard}><EmptyState message="No users found." /></div>
      ) : (
        <div style={{ ...adminCard, padding: 0, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
            <thead>
              <tr>
                {['Name', 'Email', 'Role', 'Language', 'Plan', 'Joined', 'Children', ''].map((h) => (
                  <th key={h} style={adminTableTh}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <Fragment key={u.id}>
                  <tr onClick={() => expand(u.id)} className="cursor-pointer hover:bg-gray-50">
                    <td style={adminTableTd}>
                      {u.full_name}
                      {u.suspended && <span className="ml-2"><StatusBadge label="Suspended" variant="danger" /></span>}
                    </td>
                    <td style={adminTableTd}>{u.email ?? '—'}</td>
                    <td style={adminTableTd}><StatusBadge label={u.role} variant={u.role === 'admin' ? 'gold' : 'muted'} /></td>
                    <td style={adminTableTd}>{u.language}</td>
                    <td style={adminTableTd}>{u.subscription?.plan ?? '—'}</td>
                    <td style={adminTableTd}>{formatDate(u.created_at)}</td>
                    <td style={adminTableTd}>{u.children_count}</td>
                    <td style={adminTableTd}>{expandedId === u.id ? '▲' : '▼'}</td>
                  </tr>
                  {expandedId === u.id && (
                    <tr>
                      <td colSpan={8} style={{ padding: 16, background: '#f9fafb' }}>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold mb-2">Child Profiles</h4>
                            {children.length === 0 ? <p className="text-sm text-gray-500">No children.</p> : (
                              <ul className="text-sm space-y-1">
                                {children.map((c) => (
                                  <li key={c.id}>{c.name} — {c.age_group}, {c.points} stars, {c.total_articles_read} articles</li>
                                ))}
                              </ul>
                            )}
                          </div>
                          <div className="space-y-3">
                            <div className="flex gap-2 flex-wrap">
                              <select style={{ ...adminInput, width: 'auto' }} value={u.role} onChange={(e) => handleRole(u.id, e.target.value as UserRole)}>
                                <option value="parent">Parent</option>
                              </select>
                              <button type="button" style={adminBtn.secondary} onClick={() => handleSuspend(u.id, !u.suspended)}>
                                {u.suspended ? 'Unsuspend' : 'Suspend'}
                              </button>
                              <button type="button" style={adminBtn.danger} onClick={() => handleDelete(u.id, u.full_name)}>Delete Account</button>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold mb-1">Internal Notes</label>
                              <textarea style={{ ...adminInput, minHeight: 80 }} value={notes[u.id] ?? ''} onChange={(e) => setNotes({ ...notes, [u.id]: e.target.value })} />
                              <button type="button" style={{ ...adminBtn.secondary, marginTop: 8 }} onClick={() => handleNotes(u.id)}>Save Notes</button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
