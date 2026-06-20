import { FormEvent, useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/components/ProtectedRoute'
import AdminStatCard from '@/components/admin/AdminStatCard'
import { CardSkeleton, TableSkeleton } from '@/components/admin/AdminSkeleton'
import EmptyState from '@/components/admin/EmptyState'
import StatusBadge from '@/components/admin/StatusBadge'
import SupportRefundModal from '@/components/admin/SupportRefundModal'
import SupportAttachmentLink from '@/components/support/SupportAttachmentLink'
import SupportPagination from '@/components/support/SupportPagination'
import { SupportThreadSkeleton } from '@/components/support/SupportSkeleton'
import {
  addInternalSupportNote,
  closeSupportTicket,
  createRefundRequest,
  fetchAdminTicketDetail,
  fetchAdminSupportTickets,
  fetchSupportAgents,
  fetchSupportKpis,
  sendAdminTicketReply,
  updateSupportTicketAdmin,
  type AdminSupportTicket,
} from '@/lib/admin/support'
import { adminBtn, adminCard, adminInput, adminTableTd, adminTableTh, adminTextarea } from '@/lib/admin/styles'
import {
  SUPPORT_CATEGORIES,
  SUPPORT_PRIORITIES,
  SUPPORT_STATUSES,
  categoryLabel,
  priorityBadgeVariant,
  priorityLabel,
  statusBadgeVariant,
  statusLabel,
  type SupportStatus,
} from '@/lib/support/constants'
import type { SupportTicketDetail } from '@/lib/support/types'
import { formatDateTime } from '@/lib/admin/utils'
import { formatSupabaseError } from '@/lib/supabaseErrors'

export default function AdminSupportPage() {
  const { user } = useAuth()
  const [kpis, setKpis] = useState({ open: 0, pending: 0, resolved: 0, highPriority: 0 })
  const [kpisLoading, setKpisLoading] = useState(true)

  const [tickets, setTickets] = useState<AdminSupportTicket[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [search, setSearch] = useState('')

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<SupportTicketDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const [agents, setAgents] = useState<{ id: string; full_name: string }[]>([])
  const [reply, setReply] = useState('')
  const [needsParentReply, setNeedsParentReply] = useState(false)
  const [internalNote, setInternalNote] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [refundOpen, setRefundOpen] = useState(false)

  const pageSize = 15

  const loadKpis = useCallback(async () => {
    setKpisLoading(true)
    try {
      setKpis(await fetchSupportKpis())
    } catch {
      // KPI failure is non-fatal
    } finally {
      setKpisLoading(false)
    }
  }, [])

  const loadTickets = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchAdminSupportTickets({
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        priority: priorityFilter || undefined,
        search: search || undefined,
        page,
        pageSize,
      })
      setTickets(result.data)
      setTotal(result.total)
    } catch (err) {
      setError(formatSupabaseError(err))
    } finally {
      setLoading(false)
    }
  }, [statusFilter, categoryFilter, priorityFilter, search, page, pageSize])

  const loadDetail = useCallback(async () => {
    if (!selectedId) return
    setDetailLoading(true)
    try {
      setDetail(await fetchAdminTicketDetail(selectedId))
    } catch (err) {
      setError(formatSupabaseError(err))
    } finally {
      setDetailLoading(false)
    }
  }, [selectedId])

  useEffect(() => {
    void loadKpis()
    void fetchSupportAgents().then(setAgents)
  }, [loadKpis])

  useEffect(() => {
    void loadTickets()
  }, [loadTickets])

  useEffect(() => {
    if (selectedId) void loadDetail()
    else setDetail(null)
  }, [selectedId, loadDetail])

  const refreshAll = async () => {
    await Promise.all([loadKpis(), loadTickets(), selectedId ? loadDetail() : Promise.resolve()])
  }

  const handleReply = async (e: FormEvent) => {
    e.preventDefault()
    if (!user || !selectedId || !reply.trim()) return
    setActionLoading(true)
    try {
      await sendAdminTicketReply(selectedId, user.id, reply, { needsParentReply })
      setReply('')
      setNeedsParentReply(false)
      await refreshAll()
    } catch (err) {
      setError(formatSupabaseError(err))
    } finally {
      setActionLoading(false)
    }
  }

  const handleInternalNote = async (e: FormEvent) => {
    e.preventDefault()
    if (!user || !selectedId || !internalNote.trim()) return
    setActionLoading(true)
    try {
      await addInternalSupportNote(selectedId, user.id, internalNote)
      setInternalNote('')
      await loadDetail()
    } catch (err) {
      setError(formatSupabaseError(err))
    } finally {
      setActionLoading(false)
    }
  }

  const handleStatusChange = async (status: SupportStatus) => {
    if (!selectedId) return
    setActionLoading(true)
    try {
      await updateSupportTicketAdmin(selectedId, { status })
      await refreshAll()
    } catch (err) {
      setError(formatSupabaseError(err))
    } finally {
      setActionLoading(false)
    }
  }

  const handleAssign = async (assignedTo: string) => {
    if (!selectedId) return
    setActionLoading(true)
    try {
      await updateSupportTicketAdmin(selectedId, { assigned_to: assignedTo || null })
      await refreshAll()
    } catch (err) {
      setError(formatSupabaseError(err))
    } finally {
      setActionLoading(false)
    }
  }

  const handleClose = async () => {
    if (!selectedId) return
    setActionLoading(true)
    try {
      await closeSupportTicket(selectedId)
      await refreshAll()
    } catch (err) {
      setError(formatSupabaseError(err))
    } finally {
      setActionLoading(false)
    }
  }

  const handleRefund = async (amount: number, reason: string) => {
    if (!user || !selectedId) return
    await createRefundRequest(selectedId, user.id, amount, reason)
    await loadDetail()
  }

  return (
    <div>
      {kpisLoading ? (
        <CardSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <AdminStatCard label="Open Tickets" value={kpis.open} accent="articles" trend="Active now" />
          <AdminStatCard label="Pending Tickets" value={kpis.pending} accent="quizzes" trend="Awaiting action" />
          <AdminStatCard label="Resolved Tickets" value={kpis.resolved} accent="published" trend="Completed" />
          <AdminStatCard label="High Priority" value={kpis.highPriority} accent="free" trend="Needs attention" />
        </div>
      )}

      <div style={{ ...adminCard, marginBottom: 16 }}>
        <div className="flex flex-wrap gap-2 mb-4">
          <input
            style={{ ...adminInput, width: 'auto', minWidth: 200, flex: 1 }}
            placeholder="Search ticket #, subject…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
          <select
            style={{ ...adminInput, width: 'auto' }}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All statuses</option>
            {SUPPORT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            style={{ ...adminInput, width: 'auto' }}
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All categories</option>
            {SUPPORT_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <select
            style={{ ...adminInput, width: 'auto' }}
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All priorities</option>
            {SUPPORT_PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p className="text-sm text-red-600 mb-3" role="alert">
            {error}
          </p>
        )}

        {loading ? (
          <TableSkeleton rows={6} cols={8} />
        ) : tickets.length === 0 ? (
          <EmptyState message="No support tickets match your filters." />
        ) : (
          <>
            <div style={{ overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 960 }}>
                <thead>
                  <tr>
                    {[
                      'Ticket #',
                      'Parent',
                      'Subject',
                      'Category',
                      'Priority',
                      'Status',
                      'Assigned',
                      'Created',
                    ].map((h) => (
                      <th key={h} style={adminTableTh}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedId(t.id)}
                      style={{
                        cursor: 'pointer',
                        background: selectedId === t.id ? '#fffbeb' : undefined,
                      }}
                    >
                      <td style={{ ...adminTableTd, fontWeight: 700, color: '#2AAFA0' }}>
                        {t.ticket_number ?? '—'}
                      </td>
                      <td style={adminTableTd}>
                        <div className="font-semibold">{t.parent?.full_name ?? 'Unknown'}</div>
                        <div className="text-xs text-gray-500">{t.parent?.email ?? '—'}</div>
                      </td>
                      <td style={adminTableTd}>{t.subject}</td>
                      <td style={adminTableTd}>{categoryLabel(t.category ?? 'other')}</td>
                      <td style={adminTableTd}>
                        <StatusBadge
                          label={priorityLabel(t.priority ?? 'normal')}
                          variant={priorityBadgeVariant(t.priority ?? 'normal')}
                        />
                      </td>
                      <td style={adminTableTd}>
                        <StatusBadge label={statusLabel(t.status)} variant={statusBadgeVariant(t.status)} />
                      </td>
                      <td style={adminTableTd}>{t.assignee?.full_name ?? 'Unassigned'}</td>
                      <td style={adminTableTd}>{formatDateTime(t.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <SupportPagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
          </>
        )}
      </div>

      <div style={adminCard}>
        {!selectedId ? (
          <EmptyState message="Select a ticket from the table to view details and reply." />
        ) : detailLoading || !detail ? (
          <SupportThreadSkeleton />
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-bold text-teal">{detail.ticket_number}</span>
                  <StatusBadge label={statusLabel(detail.status)} variant={statusBadgeVariant(detail.status)} />
                  <StatusBadge
                    label={priorityLabel(detail.priority)}
                    variant={priorityBadgeVariant(detail.priority)}
                  />
                </div>
                <h3 className="font-bold m-0 mb-1" style={{ fontFamily: 'Playfair Display, serif', color: '#1B2F5E' }}>
                  {detail.subject}
                </h3>
                <p className="text-sm text-gray-500 m-0">
                  {detail.parent?.full_name} ({detail.parent?.email}) · {categoryLabel(detail.category)} ·{' '}
                  {formatDateTime(detail.created_at)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" style={adminBtn.secondary} onClick={() => void handleClose()} disabled={actionLoading}>
                  Close Ticket
                </button>
                <button type="button" style={adminBtn.primary} onClick={() => setRefundOpen(true)}>
                  Issue Refund
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
              <div>
                <label className="block text-xs font-semibold mb-1">Status</label>
                <select
                  style={adminInput}
                  value={detail.status}
                  onChange={(e) => void handleStatusChange(e.target.value as SupportStatus)}
                  disabled={actionLoading}
                >
                  {SUPPORT_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Assigned Admin</label>
                <select
                  style={adminInput}
                  value={detail.assigned_to ?? ''}
                  onChange={(e) => void handleAssign(e.target.value)}
                  disabled={actionLoading}
                >
                  <option value="">Unassigned</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Priority</label>
                <select
                  style={adminInput}
                  value={detail.priority}
                  onChange={(e) =>
                    void updateSupportTicketAdmin(selectedId, { priority: e.target.value }).then(refreshAll)
                  }
                  disabled={actionLoading}
                >
                  {SUPPORT_PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3 max-h-[320px] overflow-y-auto mb-6 pr-1">
              {detail.messages
                .filter((m) => !m.is_internal)
                .map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-3 text-sm whitespace-pre-wrap ${
                        msg.sender_type === 'admin' ? 'bg-teal/10 text-navy' : 'bg-gray-50 text-navy'
                      }`}
                    >
                      <p className="text-[10px] font-bold uppercase text-gray-500 m-0 mb-1">
                        {msg.sender_type === 'admin' ? 'Admin' : 'Parent'} · {formatDateTime(msg.created_at)}
                      </p>
                      <p className="m-0">{msg.message}</p>
                      {msg.attachment_url && <SupportAttachmentLink storagePath={msg.attachment_url} />}
                    </div>
                  </div>
                ))}
            </div>

            <form onSubmit={(e) => void handleReply(e)} className="mb-6">
              <label className="block text-sm font-semibold mb-1">Reply to Parent</label>
              <textarea style={adminTextarea} value={reply} onChange={(e) => setReply(e.target.value)} />
              <label className="flex items-center gap-2 mt-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={needsParentReply}
                  onChange={(e) => setNeedsParentReply(e.target.checked)}
                />
                Request a reply from the parent
              </label>
              <button type="submit" style={{ ...adminBtn.primary, marginTop: 8 }} disabled={actionLoading}>
                Send Reply
              </button>
            </form>

            <form onSubmit={(e) => void handleInternalNote(e)} className="mb-6">
              <label className="block text-sm font-semibold mb-1">Internal Notes</label>
              <textarea
                style={adminTextarea}
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                placeholder="Visible to admins only…"
              />
              <button type="submit" style={{ ...adminBtn.secondary, marginTop: 8 }} disabled={actionLoading}>
                Add Internal Note
              </button>
            </form>

            {detail.messages.some((m) => m.is_internal) && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold mb-2">Internal note history</h4>
                <ul className="space-y-2 m-0 p-0 list-none">
                  {detail.messages
                    .filter((m) => m.is_internal)
                    .map((m) => (
                      <li key={m.id} className="bg-amber-50 border border-amber-100 rounded-md p-3 text-sm">
                        <span className="text-xs text-gray-500">{formatDateTime(m.created_at)}</span>
                        <p className="m-0 mt-1 whitespace-pre-wrap">{m.message}</p>
                      </li>
                    ))}
                </ul>
              </div>
            )}

            {detail.refund_requests && detail.refund_requests.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Refund Requests</h4>
                <ul className="space-y-2 m-0 p-0 list-none">
                  {detail.refund_requests.map((r) => (
                    <li key={r.id} className="border border-gray-200 rounded-md p-3 text-sm">
                      <strong>${Number(r.amount).toFixed(2)}</strong> — {r.reason}
                      <span className="text-xs text-gray-500 ml-2">({r.status})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>

      <SupportRefundModal open={refundOpen} onClose={() => setRefundOpen(false)} onSubmit={handleRefund} />
    </div>
  )
}
