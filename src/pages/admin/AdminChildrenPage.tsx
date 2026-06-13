import { Fragment, useEffect, useMemo, useState } from 'react'
import {
  deleteChildProfile,
  fetchAdminChildren,
  fetchChildDetail,
  resetChildProgress,
  updateChildAgeGroup,
  type AdminChildRow,
} from '@/lib/admin/children'
import { adminBtn, adminCard, adminInput, adminTableTd, adminTableTh } from '@/lib/admin/styles'
import { TableSkeleton } from '@/components/admin/AdminSkeleton'
import EmptyState from '@/components/admin/EmptyState'
import StatusBadge from '@/components/admin/StatusBadge'
import { formatDate } from '@/lib/admin/utils'
import type { AgeGroup } from '@/lib/types'

export default function AdminChildrenPage() {
  const [children, setChildren] = useState<AdminChildRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [ageFilter, setAgeFilter] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof fetchChildDetail>> | null>(null)

  useEffect(() => {
    fetchAdminChildren().then(setChildren).finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return children.filter((c) => {
      if (ageFilter && c.age_group !== ageFilter) return false
      if (!q) return true
      return c.name.toLowerCase().includes(q) || (c.parent?.email?.toLowerCase().includes(q) ?? false)
    })
  }, [children, search, ageFilter])

  const expand = async (id: string) => {
    if (expandedId === id) { setExpandedId(null); return }
    setExpandedId(id)
    setDetail(await fetchChildDetail(id))
  }

  const handleAge = async (id: string, age_group: AgeGroup) => {
    await updateChildAgeGroup(id, age_group)
    setChildren((prev) => prev.map((c) => (c.id === id ? { ...c, age_group } : c)))
  }

  const handleReset = async (id: string, name: string) => {
    if (!confirm(`Reset all progress for "${name}"?`)) return
    await resetChildProgress(id)
    setDetail(await fetchChildDetail(id))
    setChildren(await fetchAdminChildren())
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete profile "${name}"?`)) return
    await deleteChildProfile(id)
    setChildren((prev) => prev.filter((c) => c.id !== id))
    setExpandedId(null)
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <input placeholder="Search name or parent email…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...adminInput, maxWidth: 280 }} />
        <select value={ageFilter} onChange={(e) => setAgeFilter(e.target.value)} style={{ ...adminInput, width: 'auto' }}>
          <option value="">All age groups</option>
          <option value="explorer">Explorer</option>
          <option value="discoverer">Discoverer</option>
          <option value="thinker">Thinker</option>
        </select>
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={7} />
      ) : filtered.length === 0 ? (
        <div style={adminCard}><EmptyState message="No child profiles found." /></div>
      ) : (
        <div style={{ ...adminCard, padding: 0, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
            <thead>
              <tr>
                {['Name', 'Parent Email', 'Age Group', 'Stars', 'Streak', 'Badges', 'Last Active', ''].map((h) => (
                  <th key={h} style={adminTableTh}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <Fragment key={c.id}>
                  <tr onClick={() => expand(c.id)} className="cursor-pointer hover:bg-gray-50">
                    <td style={adminTableTd}>{c.name}</td>
                    <td style={adminTableTd}>{c.parent?.email ?? '—'}</td>
                    <td style={adminTableTd}><StatusBadge label={c.age_group} variant="gold" /></td>
                    <td style={adminTableTd}>{c.points}</td>
                    <td style={adminTableTd}>{c.streak_days} days</td>
                    <td style={adminTableTd}>{c.badges_count}</td>
                    <td style={adminTableTd}>{formatDate(c.last_active_date)}</td>
                    <td style={adminTableTd}>{expandedId === c.id ? '▲' : '▼'}</td>
                  </tr>
                  {expandedId === c.id && detail && (
                    <tr>
                      <td colSpan={8} style={{ padding: 16, background: '#f9fafb' }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p><strong>Articles completed:</strong> {detail.articlesCompleted}</p>
                            <p><strong>Paths started:</strong> {detail.pathsStarted}</p>
                            <p><strong>Paths completed:</strong> {detail.pathsCompleted}</p>
                            <p className="mt-2"><strong>Badges:</strong></p>
                            <ul>{detail.badges.map((b, i) => <li key={i}>{b.name} — {formatDate(b.awarded_at)}</li>)}</ul>
                          </div>
                          <div className="flex flex-col gap-2 items-start">
                            <select style={{ ...adminInput, width: 'auto' }} value={c.age_group} onChange={(e) => handleAge(c.id, e.target.value as AgeGroup)}>
                              <option value="explorer">Explorer</option>
                              <option value="discoverer">Discoverer</option>
                              <option value="thinker">Thinker</option>
                            </select>
                            <button type="button" style={adminBtn.secondary} onClick={() => handleReset(c.id, c.name)}>Reset Progress</button>
                            <button type="button" style={adminBtn.danger} onClick={() => handleDelete(c.id, c.name)}>Delete Profile</button>
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
