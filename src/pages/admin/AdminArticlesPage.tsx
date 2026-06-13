import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  deleteAdminArticle,
  fetchAdminArticles,
  setArticlePublished,
  type AdminArticleListItem,
} from '@/lib/admin/articles'
import { adminBtn, adminCard, adminTableTd, adminTableTh } from '@/lib/admin/styles'
import { TableSkeleton } from '@/components/admin/AdminSkeleton'
import EmptyState from '@/components/admin/EmptyState'
import StatusBadge from '@/components/admin/StatusBadge'
import { formatDate } from '@/lib/admin/utils'
import { usulThemeLabel } from '@/lib/discoverer'
import type { UsulTheme } from '@/lib/types'

export default function AdminArticlesPage() {
  const navigate = useNavigate()
  const [articles, setArticles] = useState<AdminArticleListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [usulFilter, setUsulFilter] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      setArticles(await fetchAdminArticles())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const categories = useMemo(
    () => [...new Set(articles.map((a) => a.pillar?.name).filter(Boolean))] as string[],
    [articles]
  )

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false
      if (categoryFilter && a.pillar?.name !== categoryFilter) return false
      if (statusFilter === 'published' && !a.published) return false
      if (statusFilter === 'draft' && a.published) return false
      if (usulFilter && a.usul_theme !== usulFilter) return false
      return true
    })
  }, [articles, search, categoryFilter, statusFilter, usulFilter])

  const handleToggle = async (id: string, published: boolean) => {
    await setArticlePublished(id, !published)
    setArticles((prev) => prev.map((a) => (a.id === id ? { ...a, published: !published } : a)))
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    await deleteAdminArticle(id)
    setArticles((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3 justify-between items-center mb-4">
        <div className="flex flex-wrap gap-2 flex-1">
          <input
            placeholder="Search by title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-md min-w-[200px]"
          />
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-md">
            <option value="">All categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-md">
            <option value="">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
          <select value={usulFilter} onChange={(e) => setUsulFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-md">
            <option value="">All Usul themes</option>
            {(['tawhid', 'revelation', 'purpose', 'akhlaq', 'akhirah', 'stewardship', 'justice', 'knowledge'] as UsulTheme[]).map((t) => (
              <option key={t} value={t}>{usulThemeLabel(t)}</option>
            ))}
          </select>
        </div>
        <button type="button" style={adminBtn.primary} onClick={() => navigate('/admin/articles/new')}>
          + New Article
        </button>
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : filtered.length === 0 ? (
        <div style={adminCard}>
          <EmptyState message="No articles match your filters." action={<button type="button" style={adminBtn.primary} onClick={() => navigate('/admin/articles/new')}>Create Article</button>} />
        </div>
      ) : (
        <div style={{ ...adminCard, padding: 0, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead>
              <tr>
                {['Title', 'Category', 'Usul Theme', 'Status', 'Reading Time', 'Created', 'Actions'].map((h) => (
                  <th key={h} style={adminTableTh}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td style={adminTableTd}>{a.title}</td>
                  <td style={adminTableTd}>{a.pillar?.name ?? '—'}</td>
                  <td style={adminTableTd}>
                    {a.usul_theme ? (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-teal/10 text-teal">
                        {usulThemeLabel(a.usul_theme)}
                      </span>
                    ) : '—'}
                  </td>
                  <td style={adminTableTd}>
                    <StatusBadge label={a.published ? 'Published' : 'Draft'} variant={a.published ? 'success' : 'muted'} />
                  </td>
                  <td style={adminTableTd}>{a.reading_time_minutes} min</td>
                  <td style={adminTableTd}>{formatDate(a.created_at)}</td>
                  <td style={adminTableTd}>
                    <div className="flex flex-wrap gap-2">
                      <Link to={`/admin/articles/${a.id}`} style={{ ...adminBtn.secondary, textDecoration: 'none', display: 'inline-block' }}>Edit</Link>
                      <button type="button" style={adminBtn.secondary} onClick={() => handleToggle(a.id, a.published)}>
                        {a.published ? 'Unpublish' : 'Publish'}
                      </button>
                      <button type="button" style={adminBtn.danger} onClick={() => handleDelete(a.id, a.title)}>Delete</button>
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
