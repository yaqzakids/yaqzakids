import { Link } from 'react-router-dom'
import AdminArticlesPage from './AdminArticlesPage'
import { adminCard, adminBtn } from '@/lib/admin/styles'

export default function AdminContentPage() {
  return (
    <div>
      <div style={{ ...adminCard, marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ margin: 0, color: '#6b7280' }}>Manage articles, publish content, and edit quizzes.</p>
        <div className="flex gap-2">
          <Link to="/admin/articles/new" style={{ ...adminBtn.primary, textDecoration: 'none' }}>+ New Article</Link>
          <Link to="/admin/paths" style={{ ...adminBtn.secondary, textDecoration: 'none' }}>Manage Paths</Link>
        </div>
      </div>
      <AdminArticlesPage />
    </div>
  )
}
