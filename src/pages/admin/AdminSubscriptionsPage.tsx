import { useEffect, useMemo, useState } from 'react'
import StripeNotConnectedBanner from '@/components/admin/StripeNotConnectedBanner'
import {
  createManualSubscription,
  fetchAdminSubscriptions,
  fetchUsersForSelect,
  updateSubscription,
  type AdminSubscriptionRow,
} from '@/lib/admin/subscriptions'
import { adminBtn, adminCard, adminInput, adminTableTd, adminTableTh } from '@/lib/admin/styles'
import { TableSkeleton } from '@/components/admin/AdminSkeleton'
import EmptyState from '@/components/admin/EmptyState'
import StatusBadge from '@/components/admin/StatusBadge'
import { formatDate } from '@/lib/admin/utils'
import type { SubscriptionPlan, SubscriptionStatus } from '@/lib/types'

const plans: SubscriptionPlan[] = ['free', 'family_monthly', 'family_yearly', 'homeschool', 'school']
const statuses: SubscriptionStatus[] = ['active', 'cancelled', 'expired']

export default function AdminSubscriptionsPage() {
  const [subs, setSubs] = useState<AdminSubscriptionRow[]>([])
  const [users, setUsers] = useState<{ id: string; full_name: string; email: string | null }[]>([])
  const [loading, setLoading] = useState(true)
  const [planFilter, setPlanFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [manualUserId, setManualUserId] = useState('')
  const [manualPlan, setManualPlan] = useState<SubscriptionPlan>('family_monthly')

  useEffect(() => {
    Promise.all([fetchAdminSubscriptions(), fetchUsersForSelect()])
      .then(([s, u]) => { setSubs(s); setUsers(u) })
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => subs.filter((s) => {
    if (planFilter && s.plan !== planFilter) return false
    if (statusFilter && s.status !== statusFilter) return false
    return true
  }), [subs, planFilter, statusFilter])

  const update = async (id: string, changes: Parameters<typeof updateSubscription>[1]) => {
    await updateSubscription(id, changes)
    setSubs((prev) => prev.map((s) => (s.id === id ? { ...s, ...changes } : s)))
  }

  const handleManual = async () => {
    if (!manualUserId) return
    await createManualSubscription(manualUserId, manualPlan)
    setSubs(await fetchAdminSubscriptions())
    setManualUserId('')
  }

  return (
    <div>
      <StripeNotConnectedBanner />
      <div style={{ ...adminCard, marginBottom: 16 }}>
        <h3 className="font-bold mb-3">Give Manual Access</h3>
        <div className="flex flex-wrap gap-2">
          <select style={{ ...adminInput, width: 'auto', minWidth: 200 }} value={manualUserId} onChange={(e) => setManualUserId(e.target.value)}>
            <option value="">Select user…</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>)}
          </select>
          <select style={{ ...adminInput, width: 'auto' }} value={manualPlan} onChange={(e) => setManualPlan(e.target.value as SubscriptionPlan)}>
            {plans.filter((p) => p !== 'free').map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <button type="button" style={adminBtn.primary} onClick={handleManual}>Create Subscription</button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} style={{ ...adminInput, width: 'auto' }}>
          <option value="">All plans</option>
          {plans.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...adminInput, width: 'auto' }}>
          <option value="">All statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : filtered.length === 0 ? (
        <div style={adminCard}><EmptyState message="No subscriptions found." /></div>
      ) : (
        <div style={{ ...adminCard, padding: 0, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
            <thead>
              <tr>
                {['User', 'Plan', 'Status', 'Start', 'End', 'Stripe ID', 'Actions'].map((h) => (
                  <th key={h} style={adminTableTh}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td style={adminTableTd}>{s.user?.email ?? s.user?.full_name ?? s.user_id}</td>
                  <td style={adminTableTd}>
                    <select style={{ ...adminInput, width: 'auto' }} value={s.plan} onChange={(e) => update(s.id, { plan: e.target.value as SubscriptionPlan })}>
                      {plans.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </td>
                  <td style={adminTableTd}>
                    <StatusBadge label={s.status} variant={s.status === 'active' ? 'success' : s.status === 'cancelled' ? 'warning' : 'muted'} />
                  </td>
                  <td style={adminTableTd}>{formatDate(s.start_date)}</td>
                  <td style={adminTableTd}>
                    <input type="date" style={{ ...adminInput, width: 'auto' }} value={s.end_date ?? ''} onChange={(e) => update(s.id, { end_date: e.target.value || null })} />
                  </td>
                  <td style={{ ...adminTableTd, fontSize: 12, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.stripe_subscription_id ?? '—'}</td>
                  <td style={adminTableTd}>
                    <div className="flex flex-col gap-1">
                      <select style={{ ...adminInput, width: 'auto' }} value={s.status} onChange={(e) => update(s.id, { status: e.target.value as SubscriptionStatus })}>
                        {statuses.map((st) => <option key={st} value={st}>{st}</option>)}
                      </select>
                      <button type="button" style={adminBtn.danger} onClick={() => update(s.id, { status: 'cancelled' })}>Cancel</button>
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
