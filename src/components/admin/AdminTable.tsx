import type { ReactNode } from 'react'
import { adminCard, adminTableTd, adminTableTh } from '@/lib/admin/styles'

interface AdminTableColumn<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
}

interface AdminTableProps<T> {
  columns: AdminTableColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string
  emptyMessage?: string
}

export default function AdminTable<T>({ columns, rows, rowKey, emptyMessage = 'No records found.' }: AdminTableProps<T>) {
  if (rows.length === 0) {
    return (
      <div style={adminCard}>
        <p style={{ margin: 0, color: '#6b7280' }}>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div style={{ ...adminCard, overflowX: 'auto', padding: 0 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={adminTableTh}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((col) => (
                <td key={col.key} style={adminTableTd}>{col.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
