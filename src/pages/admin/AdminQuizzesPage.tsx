import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchAdminPathOptions,
  fetchAdminPillarOptions,
  fetchQuizAdminArticles,
  type AdminQuizArticleRow,
} from '@/lib/admin/quizzes'
import { adminBtn, adminInput, adminTableTd, adminTableTh } from '@/lib/admin/styles'
import { dashboardCard, dashboardTheme } from '@/lib/admin/dashboardTheme'
import { TableSkeleton } from '@/components/admin/AdminSkeleton'
import EmptyState from '@/components/admin/EmptyState'
import StatusBadge from '@/components/admin/StatusBadge'

export default function AdminQuizzesPage() {
  const [articles, setArticles] = useState<AdminQuizArticleRow[]>([])
  const [paths, setPaths] = useState<{ id: string; title: string }[]>([])
  const [pillars, setPillars] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [pathFilter, setPathFilter] = useState('')
  const [pillarFilter, setPillarFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    Promise.all([fetchQuizAdminArticles(), fetchAdminPathOptions(), fetchAdminPillarOptions()])
      .then(([rows, pathOpts, pillarOpts]) => {
        setArticles(rows)
        setPaths(pathOpts)
        setPillars(pillarOpts)
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false
      if (pathFilter && a.pathId !== pathFilter) return false
      if (pillarFilter && a.pillar?.id !== pillarFilter) return false
      if (statusFilter === 'published' && !a.published) return false
      if (statusFilter === 'draft' && a.published) return false
      return true
    })
  }, [articles, search, pathFilter, pillarFilter, statusFilter])

  return (
    <div>
      <div style={{ ...dashboardCard, marginBottom: 16 }}>
        <h2
          style={{
            margin: '0 0 4px',
            fontFamily: 'Playfair Display, serif',
            color: dashboardTheme.navy,
            fontSize: 24,
          }}
        >
          Quizzes
        </h2>
        <p style={{ margin: 0, color: dashboardTheme.muted, fontSize: 14 }}>
          Manage quiz questions for each adventure article.
        </p>
      </div>

      <div style={{ ...dashboardCard, marginBottom: 16 }}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <input
            style={adminInput}
            placeholder="Search articles…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select style={adminInput} value={pathFilter} onChange={(e) => setPathFilter(e.target.value)}>
            <option value="">All paths</option>
            {paths.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
          <select style={adminInput} value={pillarFilter} onChange={(e) => setPillarFilter(e.target.value)}>
            <option value="">All pillars</option>
            {pillars.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select style={adminInput} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Unpublished</option>
          </select>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : filtered.length === 0 ? (
        <div style={dashboardCard}>
          <EmptyState message="No articles match your filters." />
        </div>
      ) : (
        <div style={{ ...dashboardCard, padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Article', 'Path', 'Pillar', 'Questions', 'Status', 'Actions'].map((h) => (
                  <th key={h} style={adminTableTh}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td style={adminTableTd}>
                    <div className="font-semibold" style={{ color: dashboardTheme.navy }}>{a.title}</div>
                    <div className="text-xs text-gray-500">{a.slug}</div>
                  </td>
                  <td style={adminTableTd}>{a.pathTitle ?? '—'}</td>
                  <td style={adminTableTd}>{a.pillar?.name ?? '—'}</td>
                  <td style={adminTableTd}>
                    <span className="font-bold" style={{ color: dashboardTheme.gold }}>{a.questionCount}</span>
                  </td>
                  <td style={adminTableTd}>
                    <StatusBadge label={a.published ? 'Published' : 'Draft'} variant={a.published ? 'success' : 'warning'} />
                  </td>
                  <td style={adminTableTd}>
                    <Link
                      to={`/admin/quizzes/${a.id}`}
                      style={{ ...adminBtn.primary, textDecoration: 'none', display: 'inline-block', fontSize: 13 }}
                    >
                      Edit Quiz
                    </Link>
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
