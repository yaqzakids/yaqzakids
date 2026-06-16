import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { deleteAdminPath, fetchAdminPaths, type AdminPathListItem } from '@/lib/admin/paths'
import { LEARNING_PATHS } from '@/lib/learningPaths'
import { adminBtn, adminCard, adminTableTd, adminTableTh } from '@/lib/admin/styles'
import { TableSkeleton } from '@/components/admin/AdminSkeleton'
import EmptyState from '@/components/admin/EmptyState'
import StatusBadge from '@/components/admin/StatusBadge'

export default function AdminPathsPage() {
  const navigate = useNavigate()
  const [paths, setPaths] = useState<AdminPathListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAdminPaths().then(setPaths).finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete path "${title}"?`)) return
    await deleteAdminPath(id)
    setPaths((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div>
      <div style={{ ...adminCard, marginBottom: 16 }}>
        <h2 className="font-bold text-lg m-0 mb-2">Public learning paths</h2>
        <p className="text-sm text-gray-600 m-0 mb-4">
          These are the 7 marketing paths linked from the navbar. Edit the matching adventure path below or assign a public slug in the editor.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {LEARNING_PATHS.map((p) => (
            <div key={p.slug} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
              <div className="font-semibold text-sm">{p.icon} {p.name}</div>
              <div className="text-xs text-gray-500 mt-1">/paths/{p.slug}</div>
              <a
                href={`/paths/${p.slug}`}
                target="_blank"
                rel="noreferrer"
                style={{ ...adminBtn.secondary, textDecoration: 'none', display: 'inline-block', marginTop: 8, fontSize: 12 }}
              >
                Preview public page
              </a>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end mb-4">
        <button type="button" style={adminBtn.primary} onClick={() => navigate('/admin/paths/new')}>+ New Path</button>
      </div>

      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : paths.length === 0 ? (
        <div style={adminCard}><EmptyState message="No adventure paths yet." /></div>
      ) : (
        <div style={{ ...adminCard, padding: 0, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
            <thead>
              <tr>
                {['Title', 'Pillar', 'Difficulty', 'Access', 'Articles', 'Actions'].map((h) => (
                  <th key={h} style={adminTableTh}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paths.map((p) => (
                <tr key={p.id}>
                  <td style={adminTableTd}>{p.title}</td>
                  <td style={adminTableTd}>{p.pillar?.name ?? '—'}</td>
                  <td style={adminTableTd}>{p.difficulty_level}</td>
                  <td style={adminTableTd}>
                    <StatusBadge label={p.is_free ? 'Free' : 'Paid'} variant={p.is_free ? 'success' : 'gold'} />
                  </td>
                  <td style={adminTableTd}>{p.article_count}</td>
                  <td style={adminTableTd}>
                    <div className="flex gap-2">
                      <Link to={`/admin/paths/${p.id}`} style={{ ...adminBtn.secondary, textDecoration: 'none' }}>Edit</Link>
                      <button type="button" style={adminBtn.danger} onClick={() => handleDelete(p.id, p.title)}>Delete</button>
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
