import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminStatCard from '@/components/admin/AdminStatCard'
import StripeNotConnectedBanner from '@/components/admin/StripeNotConnectedBanner'
import { CardSkeleton, TableSkeleton } from '@/components/admin/AdminSkeleton'
import EmptyState from '@/components/admin/EmptyState'
import StatusBadge from '@/components/admin/StatusBadge'
import ErrorMessage from '@/components/ErrorMessage'
import {
  fetchAdminRefunds,
  fetchRefundStats,
  updateRefundStatus,
} from '@/lib/admin/refunds'
import type { AdminRefundRow, RefundStatus } from '@/types/payments'
import { adminBtn, adminCard, adminColors, adminInput, adminTableTd, adminTableTh } from '@/lib/admin/styles'
import { formatDateTime } from '@/lib/admin/utils'
import { isStripeConnected } from '@/lib/stripe'
import { formatSupabaseError } from '@/lib/supabaseErrors'

const STATUSES: RefundStatus[] = ['pending', 'approved', 'rejected', 'processed']

export default function AdminRefunds() {
  const [rows, setRows] = useState<AdminRefundRow[]>([])
  const [stats, setStats] = useState<Awaited<ReturnType<typeof fetchRefundStats>> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({})
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [refunds, refundStats] = await Promise.all([fetchAdminRefunds(), fetchRefundStats()])
      setRows(refunds)
      setStats(refundStats)
    } catch (err) {
      setError(formatSupabaseError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filtered = rows.filter((r) => !statusFilter || r.status === statusFilter)

  const handleStatusUpdate = async (row: AdminRefundRow, status: RefundStatus) => {
    if (status === 'processed' && !isStripeConnected()) {
      if (!window.confirm('Stripe is not connected. Mark as processed internally only (no real refund)?')) return
    }
    setUpdatingId(row.id)
    try {
      await updateRefundStatus(row.id, status, notesDraft[row.id] ?? row.admin_notes ?? undefined)
      await load()
    } catch (err) {
      setError(formatSupabaseError(err))
    } finally {
      setUpdatingId(null)
    }
  }

  const statusVariant = (status: string) => {
    if (status === 'pending') return 'warning'
    if (status === 'approved' || status === 'processed') return 'success'
    if (status === 'rejected') return 'danger'
    return 'muted'
  }

  return (
    <div>
      <StripeNotConnectedBanner />

      {error && <ErrorMessage message={error} onRetry={() => void load()} />}

      {loading && !stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <AdminStatCard label="Pending" value={stats.pending} accent="free" trend="Awaiting review" />
          <AdminStatCard label="Approved" value={stats.approved} accent="published" trend="Ready to process" />
          <AdminStatCard label="Processed" value={stats.processed} accent="subscribers" trend="Completed" />
          <AdminStatCard
            label="Pending Amount"
            value={`$${stats.totalAmountPending.toFixed(2)}`}
            accent="quizzes"
            trend="Internal tracking only"
          />
        </div>
      ) : null}

      <div style={{ ...adminCard, marginBottom: 16 }}>
        <p className="text-sm text-gray-600 m-0">
          Refund requests from support tickets are tracked here.{' '}
          {!isStripeConnected() && (
            <strong style={{ color: adminColors.navy }}>Stripe not connected — status updates are internal records only.</strong>
          )}{' '}
          Create new requests from{' '}
          <Link to="/admin/support" className="text-teal font-semibold">Support Tickets</Link>.
        </p>
      </div>

      <div className="flex gap-2 mb-4">
        <select style={{ ...adminInput, width: 'auto' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <TableSkeleton rows={5} cols={7} />
      ) : filtered.length === 0 ? (
        <div style={adminCard}><EmptyState message="No refund requests found." /></div>
      ) : (
        <div style={{ ...adminCard, padding: 0, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 960 }}>
            <thead>
              <tr>
                {['Date', 'Ticket', 'Family', 'Amount', 'Reason', 'Status', 'Admin Notes', 'Actions'].map((h) => (
                  <th key={h} style={adminTableTh}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id}>
                  <td style={adminTableTd}>{formatDateTime(row.created_at)}</td>
                  <td style={adminTableTd}>
                    {row.ticket ? (
                      <Link to="/admin/support" className="text-teal font-semibold no-underline">
                        {row.ticket.ticket_number}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td style={adminTableTd}>
                    {row.ticket?.parent?.full_name ?? row.ticket?.parent?.email ?? '—'}
                  </td>
                  <td style={adminTableTd}>${Number(row.amount).toFixed(2)}</td>
                  <td style={{ ...adminTableTd, maxWidth: 180 }}>{row.reason}</td>
                  <td style={adminTableTd}>
                    <StatusBadge label={row.status} variant={statusVariant(row.status)} />
                  </td>
                  <td style={adminTableTd}>
                    <input
                      style={{ ...adminInput, minWidth: 140 }}
                      value={notesDraft[row.id] ?? row.admin_notes ?? ''}
                      onChange={(e) => setNotesDraft((prev) => ({ ...prev, [row.id]: e.target.value }))}
                      placeholder="Internal notes"
                    />
                  </td>
                  <td style={adminTableTd}>
                    <div className="flex flex-col gap-1 min-w-[120px]">
                      {row.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            style={adminBtn.secondary}
                            disabled={updatingId === row.id}
                            onClick={() => void handleStatusUpdate(row, 'approved')}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            style={adminBtn.danger}
                            disabled={updatingId === row.id}
                            onClick={() => void handleStatusUpdate(row, 'rejected')}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {row.status === 'approved' && (
                        <button
                          type="button"
                          style={adminBtn.primary}
                          disabled={updatingId === row.id}
                          onClick={() => void handleStatusUpdate(row, 'processed')}
                        >
                          Mark Processed
                        </button>
                      )}
                      {row.stripe_refund_id && (
                        <span className="text-[10px] text-gray-500">Stripe: {row.stripe_refund_id}</span>
                      )}
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
