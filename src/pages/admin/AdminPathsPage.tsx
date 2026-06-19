import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  deleteAdminPath,
  fetchAdminPaths,
  movePathOrder,
  togglePathStatus,
  type AdminPathListItem,
} from '@/lib/admin/paths'
import { LEARNING_PATHS } from '@/lib/learningPaths'
import { adminBtn, adminCard, adminTableTd, adminTableTh } from '@/lib/admin/styles'
import { TableSkeleton } from '@/components/admin/AdminSkeleton'
import EmptyState from '@/components/admin/EmptyState'
import StatusBadge from '@/components/admin/StatusBadge'

export default function AdminPathsPage() {
  const navigate = useNavigate()
  const [paths, setPaths] = useState<AdminPathListItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    fetchAdminPaths().then(setPaths).finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete path "${title}"? This cannot be undone.`)) return
    await deleteAdminPath(id)
    setPaths((prev) => prev.filter((p) => p.id !== id))
  }

  const handleToggleStatus = async (path: AdminPathListItem) => {
    const next = path.status === 'published' ? 'draft' : 'published'
    await togglePathStatus(path.id, next)
    load()
  }

  const handleMove = async (id: string, direction: 'up' | 'down') => {
    await movePathOrder(id, direction, paths)
    load()
  }

  const previewSlug = (p: AdminPathListItem) =>
    p.public_slug ?? LEARNING_PATHS.find((lp) => lp.adventureSlug === p.slug)?.slug ?? p.slug

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-lg m-0">Learning Paths</h2>
        <button type="button" style={adminBtn.primary} onClick={() => navigate('/admin/paths/new')}>
          + New Path
        </button>
      </div>

      {loading ? (
        <TableSkeleton rows={7} cols={8} />
      ) : paths.length === 0 ? (
        <div style={adminCard}>
          <EmptyState message="No learning paths yet." />
        </div>
      ) : (
        <div style={{ ...adminCard, padding: 0, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 960 }}>
            <thead>
              <tr>
                {['', 'Title', 'Slug', 'Pillar', 'Lessons', 'Access', 'Status', 'Order', 'Actions'].map((h) => (
                  <th key={h || 'icon'} style={adminTableTh}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paths.map((p, index) => (
                <tr key={p.id}>
                  <td style={adminTableTd}>{p.icon ?? '🗺️'}</td>
                  <td style={adminTableTd}>{p.title}</td>
                  <td style={adminTableTd}>
                    <code className="text-xs">{p.public_slug ?? p.slug}</code>
                  </td>
                  <td style={adminTableTd}>{p.pillar?.name ?? '—'}</td>
                  <td style={adminTableTd}>{p.article_count}</td>
                  <td style={adminTableTd}>
                    <StatusBadge label={p.is_free ? 'Free' : 'Premium'} variant={p.is_free ? 'success' : 'gold'} />
                  </td>
                  <td style={adminTableTd}>
                    <button
                      type="button"
                      style={adminBtn.secondary}
                      onClick={() => void handleToggleStatus(p)}
                    >
                      {p.status === 'published' ? 'Active' : p.status ?? 'draft'}
                    </button>
                  </td>
                  <td style={adminTableTd}>
                    <div className="flex gap-1">
                      <button type="button" style={adminBtn.secondary} disabled={index === 0} onClick={() => void handleMove(p.id, 'up')}>↑</button>
                      <button type="button" style={adminBtn.secondary} disabled={index === paths.length - 1} onClick={() => void handleMove(p.id, 'down')}>↓</button>
                    </div>
                  </td>
                  <td style={adminTableTd}>
                    <div className="flex gap-2 flex-wrap">
                      <Link to={`/admin/paths/${p.id}`} style={{ ...adminBtn.secondary, textDecoration: 'none' }}>Edit</Link>
                      <a href={`/paths/${previewSlug(p)}`} target="_blank" rel="noreferrer" style={{ ...adminBtn.secondary, textDecoration: 'none' }}>Preview</a>
                      <button type="button" style={adminBtn.danger} onClick={() => void handleDelete(p.id, p.title)}>Delete</button>
                    </div>
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
