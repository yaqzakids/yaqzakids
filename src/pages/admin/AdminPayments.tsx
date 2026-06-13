import { FormEvent, useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/components/ProtectedRoute'
import AdminStatCard from '@/components/admin/AdminStatCard'
import StripeNotConnectedBanner from '@/components/admin/StripeNotConnectedBanner'
import { CardSkeleton, TableSkeleton } from '@/components/admin/AdminSkeleton'
import EmptyState from '@/components/admin/EmptyState'
import StatusBadge from '@/components/admin/StatusBadge'
import ErrorMessage from '@/components/ErrorMessage'
import {
  createFailedPaymentEvent,
  createInternalPaymentNote,
  fetchFailedPayments,
  fetchManualAccessGrants,
  fetchPaymentOverview,
  fetchPaymentRecords,
  formatCents,
  grantManualFamilyAccess,
  updateFailedPaymentStatus,
} from '@/lib/admin/payments'
import type { FailedPaymentRow, PaymentRecordRow, PaymentsAdminTab } from '@/types/payments'
import { fetchUsersForSelect } from '@/lib/admin/subscriptions'
import { adminBtn, adminCard, adminColors, adminInput, adminTableTd, adminTableTh } from '@/lib/admin/styles'
import { formatDateTime } from '@/lib/admin/utils'
import { isStripeConnected } from '@/lib/stripe'
import type { SubscriptionPlan } from '@/lib/types'
import { formatSupabaseError } from '@/lib/supabaseErrors'

type Tab = PaymentsAdminTab

const PAID_PLANS: SubscriptionPlan[] = ['family_monthly', 'family_yearly', 'homeschool', 'school']

export default function AdminPayments() {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [overview, setOverview] = useState<Awaited<ReturnType<typeof fetchPaymentOverview>> | null>(null)
  const [records, setRecords] = useState<PaymentRecordRow[]>([])
  const [failed, setFailed] = useState<FailedPaymentRow[]>([])
  const [grants, setGrants] = useState<Awaited<ReturnType<typeof fetchManualAccessGrants>>>([])
  const [users, setUsers] = useState<{ id: string; full_name: string; email: string | null }[]>([])

  const [noteUserId, setNoteUserId] = useState('')
  const [noteText, setNoteText] = useState('')
  const [failedUserId, setFailedUserId] = useState('')
  const [failedAmount, setFailedAmount] = useState('')
  const [failedReason, setFailedReason] = useState('')
  const [accessUserId, setAccessUserId] = useState('')
  const [accessPlan, setAccessPlan] = useState<SubscriptionPlan>('family_monthly')
  const [accessEndDate, setAccessEndDate] = useState('')
  const [accessReason, setAccessReason] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [ov, rec, fail, grantRows, userRows] = await Promise.all([
        fetchPaymentOverview(),
        fetchPaymentRecords(),
        fetchFailedPayments(),
        fetchManualAccessGrants(),
        fetchUsersForSelect(),
      ])
      setOverview(ov)
      setRecords(rec)
      setFailed(fail)
      setGrants(grantRows)
      setUsers(userRows)
    } catch (err) {
      setError(formatSupabaseError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleInternalNote = async (e: FormEvent) => {
    e.preventDefault()
    if (!user || !noteText.trim()) return
    setSaving(true)
    try {
      await createInternalPaymentNote(user.id, {
        userId: noteUserId || null,
        description: noteText,
      })
      setNoteText('')
      setNoteUserId('')
      await load()
    } catch (err) {
      setError(formatSupabaseError(err))
    } finally {
      setSaving(false)
    }
  }

  const handleLogFailed = async (e: FormEvent) => {
    e.preventDefault()
    if (!user || !failedReason.trim()) return
    setSaving(true)
    try {
      await createFailedPaymentEvent(user.id, {
        userId: failedUserId || null,
        amountCents: Math.round(parseFloat(failedAmount || '0') * 100),
        failureReason: failedReason,
      })
      setFailedReason('')
      setFailedAmount('')
      setFailedUserId('')
      await load()
    } catch (err) {
      setError(formatSupabaseError(err))
    } finally {
      setSaving(false)
    }
  }

  const handleManualAccess = async (e: FormEvent) => {
    e.preventDefault()
    if (!user || !accessUserId) return
    setSaving(true)
    try {
      await grantManualFamilyAccess(user.id, {
        userId: accessUserId,
        plan: accessPlan,
        endDate: accessEndDate || null,
        reason: accessReason,
      })
      setAccessUserId('')
      setAccessReason('')
      setAccessEndDate('')
      await load()
    } catch (err) {
      setError(formatSupabaseError(err))
    } finally {
      setSaving(false)
    }
  }

  const resolveFailed = async (row: FailedPaymentRow, status: FailedPaymentRow['status']) => {
    try {
      await updateFailedPaymentStatus(row.id, status, row.admin_notes ?? undefined)
      await load()
    } catch (err) {
      setError(formatSupabaseError(err))
    }
  }

  return (
    <div>
      <StripeNotConnectedBanner />
      {error && <ErrorMessage message={error} onRetry={() => void load()} />}

      {loading && !overview ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : overview ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <AdminStatCard label="Active Subscriptions" value={overview.activeSubscriptions} accent="subscribers" trend="Currently active" />
          <AdminStatCard label="Paid Plans" value={overview.paidSubscriptions} accent="published" trend="Non-free active" />
          <AdminStatCard label="Open Failed Payments" value={overview.openFailedPayments} accent="free" trend="Needs follow-up" />
          <AdminStatCard label="Pending Refunds" value={overview.pendingRefunds} accent="quizzes" trend="Awaiting review" />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 mb-4">
        {([
          ['overview', 'Subscription Overview'],
          ['records', 'Payment Records'],
          ['failed', 'Failed Payments'],
          ['access', 'Manual Access'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            style={tab === key ? adminBtn.primary : adminBtn.secondary}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div style={adminCard}>
            <h3 className="font-bold m-0 mb-3" style={{ fontFamily: 'Playfair Display, serif', color: adminColors.navy }}>
              Subscriptions by Plan
            </h3>
            {loading ? (
              <TableSkeleton rows={4} cols={2} />
            ) : !overview ? null : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {Object.entries(overview.byPlan).map(([plan, count]) => (
                    <tr key={plan}>
                      <td style={{ ...adminTableTd, textTransform: 'capitalize' }}>{plan.replace(/_/g, ' ')}</td>
                      <td style={{ ...adminTableTd, fontWeight: 700 }}>{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <p className="text-xs text-gray-500 mt-3 mb-0">
              Manage individual subscriptions on{' '}
              <Link to="/admin/subscriptions" className="text-teal font-semibold">Subscriptions</Link>.
            </p>
          </div>
          <div style={adminCard}>
            <h3 className="font-bold m-0 mb-3" style={{ fontFamily: 'Playfair Display, serif', color: adminColors.navy }}>
              Stripe Status
            </h3>
            <StatusBadge
              label={isStripeConnected() ? 'Stripe connected' : 'Stripe not connected'}
              variant={isStripeConnected() ? 'success' : 'warning'}
            />
            <ul className="text-sm text-gray-600 mt-4 mb-0 pl-5 space-y-1">
              <li>Invoices sync when Stripe webhooks are configured</li>
              <li>Refunds require Stripe — tracked internally until then</li>
              <li>Discount codes apply at checkout once Stripe is live</li>
            </ul>
          </div>
        </div>
      )}

      {tab === 'records' && (
        <>
          <div style={{ ...adminCard, marginBottom: 16 }}>
            <h3 className="font-bold m-0 mb-2" style={{ fontFamily: 'Playfair Display, serif', color: adminColors.navy }}>
              Log Internal Payment Note
            </h3>
            <p className="text-sm text-gray-500 m-0 mb-3">
              For admin records only. Does not charge or process payments.
            </p>
            <form onSubmit={(e) => void handleInternalNote(e)} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select style={adminInput} value={noteUserId} onChange={(e) => setNoteUserId(e.target.value)}>
                <option value="">Family (optional)</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                ))}
              </select>
              <input style={adminInput} placeholder="Note description" value={noteText} onChange={(e) => setNoteText(e.target.value)} required />
              <button type="submit" style={adminBtn.primary} disabled={saving}>Save Internal Record</button>
            </form>
          </div>
          {loading ? (
            <TableSkeleton rows={5} cols={5} />
          ) : records.length === 0 ? (
            <div style={adminCard}><EmptyState message="No payment records yet. Stripe invoices will appear here once connected." /></div>
          ) : (
            <div style={{ ...adminCard, padding: 0, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
                <thead>
                  <tr>
                    {['Date', 'Family', 'Description', 'Amount', 'Status', 'Source'].map((h) => (
                      <th key={h} style={adminTableTh}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id}>
                      <td style={adminTableTd}>{formatDateTime(r.created_at)}</td>
                      <td style={adminTableTd}>{r.user?.full_name ?? r.user?.email ?? '—'}</td>
                      <td style={adminTableTd}>{r.description}</td>
                      <td style={adminTableTd}>{formatCents(r.amount_cents, r.currency)}</td>
                      <td style={adminTableTd}>
                        <StatusBadge label={r.status} variant={r.status === 'succeeded' ? 'success' : r.status === 'failed' ? 'danger' : 'muted'} />
                      </td>
                      <td style={adminTableTd}>{r.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'failed' && (
        <>
          <div style={{ ...adminCard, marginBottom: 16 }}>
            <h3 className="font-bold m-0 mb-2" style={{ fontFamily: 'Playfair Display, serif', color: adminColors.navy }}>
              Record Failed Payment
            </h3>
            <p className="text-sm text-gray-500 m-0 mb-3">
              Log failed payment attempts for follow-up. Stripe webhooks will populate this automatically once connected.
            </p>
            <form onSubmit={(e) => void handleLogFailed(e)} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select style={adminInput} value={failedUserId} onChange={(e) => setFailedUserId(e.target.value)}>
                <option value="">Family (optional)</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.full_name}</option>
                ))}
              </select>
              <input style={adminInput} type="number" step="0.01" min="0" placeholder="Amount (USD)" value={failedAmount} onChange={(e) => setFailedAmount(e.target.value)} />
              <input style={adminInput} placeholder="Failure reason" value={failedReason} onChange={(e) => setFailedReason(e.target.value)} required />
              <button type="submit" style={adminBtn.primary} disabled={saving}>Log Failed Payment</button>
            </form>
          </div>
          {loading ? (
            <TableSkeleton rows={4} cols={6} />
          ) : failed.length === 0 ? (
            <div style={adminCard}><EmptyState message="No failed payments recorded." /></div>
          ) : (
            <div style={{ ...adminCard, padding: 0, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                <thead>
                  <tr>
                    {['Date', 'Family', 'Amount', 'Reason', 'Status', 'Actions'].map((h) => (
                      <th key={h} style={adminTableTh}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {failed.map((row) => (
                    <tr key={row.id}>
                      <td style={adminTableTd}>{formatDateTime(row.created_at)}</td>
                      <td style={adminTableTd}>{row.user?.full_name ?? '—'}</td>
                      <td style={adminTableTd}>{formatCents(row.amount_cents)}</td>
                      <td style={adminTableTd}>{row.failure_reason}</td>
                      <td style={adminTableTd}>
                        <StatusBadge label={row.status} variant={row.status === 'open' ? 'warning' : 'success'} />
                      </td>
                      <td style={adminTableTd}>
                        {row.status === 'open' && (
                          <div className="flex gap-2 flex-wrap">
                            <button type="button" style={adminBtn.secondary} onClick={() => void resolveFailed(row, 'resolved')}>Resolve</button>
                            <button type="button" style={adminBtn.secondary} onClick={() => void resolveFailed(row, 'waived')}>Waive</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'access' && (
        <>
          <div style={{ ...adminCard, marginBottom: 16 }}>
            <h3 className="font-bold m-0 mb-2" style={{ fontFamily: 'Playfair Display, serif', color: adminColors.navy }}>
              Grant Manual Family Access
            </h3>
            <p className="text-sm text-gray-500 m-0 mb-3">
              Updates the family subscription in Supabase directly. No Stripe charge is created.
            </p>
            <form onSubmit={(e) => void handleManualAccess(e)} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select style={adminInput} value={accessUserId} onChange={(e) => setAccessUserId(e.target.value)} required>
                <option value="">Select family…</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                ))}
              </select>
              <select style={adminInput} value={accessPlan} onChange={(e) => setAccessPlan(e.target.value as SubscriptionPlan)}>
                {PAID_PLANS.map((p) => (
                  <option key={p} value={p}>{p.replace(/_/g, ' ')}</option>
                ))}
              </select>
              <input type="date" style={adminInput} value={accessEndDate} onChange={(e) => setAccessEndDate(e.target.value)} />
              <input style={adminInput} placeholder="Reason (optional)" value={accessReason} onChange={(e) => setAccessReason(e.target.value)} />
              <button type="submit" style={adminBtn.primary} disabled={saving || !accessUserId}>Grant Access</button>
            </form>
          </div>
          {loading ? (
            <TableSkeleton rows={4} cols={5} />
          ) : grants.length === 0 ? (
            <div style={adminCard}><EmptyState message="No manual access grants yet." /></div>
          ) : (
            <div style={{ ...adminCard, padding: 0, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
                <thead>
                  <tr>
                    {['Date', 'Family', 'Plan', 'End Date', 'Reason'].map((h) => (
                      <th key={h} style={adminTableTh}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {grants.map((g) => (
                    <tr key={g.id}>
                      <td style={adminTableTd}>{formatDateTime(g.created_at)}</td>
                      <td style={adminTableTd}>{g.user?.full_name ?? g.user?.email}</td>
                      <td style={adminTableTd}>{g.plan.replace(/_/g, ' ')}</td>
                      <td style={adminTableTd}>{g.end_date ?? '—'}</td>
                      <td style={adminTableTd}>{g.reason ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
