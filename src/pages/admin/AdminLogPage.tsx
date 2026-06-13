import { useEffect, useState } from 'react'
import { fetchAdminActivityLog, type AdminActivityEntry } from '@/lib/admin/activity'
import AdminTable from '@/components/admin/AdminTable'
import { TableSkeleton } from '@/components/admin/AdminSkeleton'
import { formatDateTime } from '@/lib/admin/utils'

export default function AdminLogPage() {
  const [entries, setEntries] = useState<AdminActivityEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAdminActivityLog(100)
      .then(setEntries)
      .catch(() => setError('Could not load admin activity log.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <TableSkeleton rows={8} cols={5} />
  if (error) return <p style={{ color: '#dc2626' }}>{error}</p>

  return (
    <AdminTable
      rows={entries}
      rowKey={(e) => e.id}
      emptyMessage="No admin actions logged yet."
      columns={[
        { key: 'time', header: 'Time', render: (e) => formatDateTime(e.created_at) },
        { key: 'admin', header: 'Admin', render: (e) => e.admin?.full_name ?? '—' },
        { key: 'action', header: 'Action', render: (e) => e.action.replace(/_/g, ' ') },
        { key: 'entity', header: 'Target Type', render: (e) => e.entity_type ?? '—' },
        { key: 'id', header: 'Target ID', render: (e) => (e.entity_id ? `${e.entity_id.slice(0, 8)}…` : '—') },
      ]}
    />
  )
}
