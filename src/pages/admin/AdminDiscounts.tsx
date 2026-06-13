import { FormEvent, useEffect, useState } from 'react'
import { useAuth } from '@/components/ProtectedRoute'
import StripeNotConnectedBanner from '@/components/admin/StripeNotConnectedBanner'
import { TableSkeleton } from '@/components/admin/AdminSkeleton'
import EmptyState from '@/components/admin/EmptyState'
import StatusBadge from '@/components/admin/StatusBadge'
import ErrorMessage from '@/components/ErrorMessage'
import {
  createDiscountCode,
  deleteDiscountCode,
  fetchDiscountCodes,
  formatDiscountValue,
  generateDiscountCode,
  toggleDiscountActive,
} from '@/lib/admin/discounts'
import { extendFreeTrial, fetchTrialExtensions } from '@/lib/admin/trials'
import type { DiscountCode, DiscountType, DiscountsAdminTab, TrialExtensionRow } from '@/types/payments'
import { fetchUsersForSelect } from '@/lib/admin/subscriptions'
import { adminBtn, adminCard, adminColors, adminInput, adminTableTd, adminTableTh } from '@/lib/admin/styles'
import { formatDate, formatDateTime } from '@/lib/admin/utils'
import { formatSupabaseError } from '@/lib/supabaseErrors'

type Tab = DiscountsAdminTab

export default function AdminDiscounts() {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('coupons')
  const [codes, setCodes] = useState<DiscountCode[]>([])
  const [trials, setTrials] = useState<TrialExtensionRow[]>([])
  const [users, setUsers] = useState<{ id: string; full_name: string; email: string | null }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    code: '',
    discount_type: 'percentage' as DiscountType,
    discount_value: 10,
    max_uses: 100,
    valid_from: '',
    valid_until: '',
    plan: '',
    allPlans: false,
  })

  const [trialUserId, setTrialUserId] = useState('')
  const [trialDays, setTrialDays] = useState(7)
  const [trialReason, setTrialReason] = useState('')

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [codeRows, trialRows, userRows] = await Promise.all([
        fetchDiscountCodes(),
        fetchTrialExtensions(),
        fetchUsersForSelect(),
      ])
      setCodes(codeRows)
      setTrials(trialRows)
      setUsers(userRows)
    } catch (err) {
      setError(formatSupabaseError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const handleCreate = async () => {
    setSaving(true)
    try {
      const allPaidPlans = ['family_monthly', 'family_yearly', 'homeschool', 'school']
      await createDiscountCode({
        code: form.code || generateDiscountCode(),
        discount_type: form.discount_type,
        discount_value: form.discount_value,
        max_uses: form.max_uses,
        plan: form.allPlans ? null : form.plan || null,
        eligible_plans: form.allPlans ? allPaidPlans : undefined,
        valid_from: form.valid_from || null,
        valid_until: form.valid_until || null,
        is_active: true,
      })
      setForm({
        code: '',
        discount_type: 'percentage',
        discount_value: 10,
        max_uses: 100,
        valid_from: '',
        valid_until: '',
        plan: '',
        allPlans: false,
      })
      await load()
    } catch (err) {
      setError(formatSupabaseError(err))
    } finally {
      setSaving(false)
    }
  }

  const handleExtendTrial = async (e: FormEvent) => {
    e.preventDefault()
    if (!user || !trialUserId) return
    setSaving(true)
    try {
      await extendFreeTrial(user.id, trialUserId, trialDays, trialReason)
      setTrialUserId('')
      setTrialReason('')
      setTrialDays(7)
      await load()
    } catch (err) {
      setError(formatSupabaseError(err))
    } finally {
      setSaving(false)
    }
  }

  const copyCode = (code: string) => navigator.clipboard.writeText(code)

  return (
    <div>
      <StripeNotConnectedBanner />

      {error && <ErrorMessage message={error} onRetry={() => void load()} />}

      <div className="flex flex-wrap gap-2 mb-4">
        <button type="button" style={tab === 'coupons' ? adminBtn.primary : adminBtn.secondary} onClick={() => setTab('coupons')}>
          Discount Codes & Coupons
        </button>
        <button type="button" style={tab === 'trials' ? adminBtn.primary : adminBtn.secondary} onClick={() => setTab('trials')}>
          Free Trial Extensions
        </button>
      </div>

      {tab === 'coupons' && (
        <>
          <div style={{ ...adminCard, marginBottom: 16 }}>
            <h3 className="font-bold m-0 mb-1" style={{ fontFamily: 'Playfair Display, serif', color: adminColors.navy }}>
              Coupon Creator
            </h3>
            <p className="text-sm text-gray-500 m-0 mb-3">
              Codes are stored in Supabase. They will apply at Stripe checkout once billing is connected.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                style={adminInput}
                placeholder="Code (auto-generate if empty)"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              />
              <select
                style={adminInput}
                value={form.discount_type}
                onChange={(e) => setForm({ ...form, discount_type: e.target.value as 'percentage' | 'fixed' })}
              >
                <option value="percentage">Percentage off</option>
                <option value="fixed">Fixed amount off</option>
              </select>
              <input
                type="number"
                style={adminInput}
                placeholder="Value"
                value={form.discount_value}
                onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })}
              />
              <input
                type="number"
                style={adminInput}
                placeholder="Max uses"
                value={form.max_uses}
                onChange={(e) => setForm({ ...form, max_uses: Number(e.target.value) })}
              />
              <select style={adminInput} value={form.plan} disabled={form.allPlans} onChange={(e) => setForm({ ...form, plan: e.target.value })}>
                <option value="">Any plan</option>
                <option value="family_monthly">Family Monthly</option>
                <option value="family_yearly">Family Yearly</option>
                <option value="homeschool">Homeschool</option>
                <option value="school">School</option>
              </select>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.allPlans}
                  onChange={(e) => setForm({ ...form, allPlans: e.target.checked, plan: '' })}
                />
                All paid plans
              </label>
              <input type="date" style={adminInput} value={form.valid_from} onChange={(e) => setForm({ ...form, valid_from: e.target.value })} />
              <input type="date" style={adminInput} value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} />
            </div>
            <button type="button" style={{ ...adminBtn.primary, marginTop: 12 }} onClick={() => void handleCreate()} disabled={saving}>
              {saving ? 'Creating…' : 'Create Coupon'}
            </button>
          </div>

          {loading ? (
            <TableSkeleton rows={4} cols={7} />
          ) : codes.length === 0 ? (
            <div style={adminCard}><EmptyState message="No discount codes yet." /></div>
          ) : (
            <div style={{ ...adminCard, padding: 0, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                <thead>
                  <tr>
                    {['Code', 'Type', 'Value', 'Plan', 'Uses', 'Valid Until', 'Active', 'Actions'].map((h) => (
                      <th key={h} style={adminTableTh}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {codes.map((c) => (
                    <tr key={c.id}>
                      <td style={adminTableTd}><code>{c.code}</code></td>
                      <td style={adminTableTd}>{c.discount_type}</td>
                      <td style={adminTableTd}>{formatDiscountValue(c.discount_type, c.discount_value)}</td>
                      <td style={adminTableTd}>
                        {c.eligible_plans?.length
                          ? c.eligible_plans.map((p) => p.replace(/_/g, ' ')).join(', ')
                          : c.plan?.replace(/_/g, ' ') ?? 'Any'}
                      </td>
                      <td style={adminTableTd}>{c.uses_count}/{c.max_uses ?? '∞'}</td>
                      <td style={adminTableTd}>{formatDate(c.valid_until)}</td>
                      <td style={adminTableTd}>
                        <StatusBadge label={c.is_active ? 'Active' : 'Inactive'} variant={c.is_active ? 'success' : 'muted'} />
                      </td>
                      <td style={adminTableTd}>
                        <div className="flex gap-2 flex-wrap">
                          <button type="button" style={adminBtn.secondary} onClick={() => copyCode(c.code)}>Copy</button>
                          <button
                            type="button"
                            style={adminBtn.secondary}
                            onClick={async () => {
                              await toggleDiscountActive(c.id, !c.is_active)
                              await load()
                            }}
                          >
                            {c.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            type="button"
                            style={adminBtn.danger}
                            onClick={async () => {
                              if (window.confirm('Delete this code?')) {
                                await deleteDiscountCode(c.id)
                                await load()
                              }
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'trials' && (
        <>
          <div style={{ ...adminCard, marginBottom: 16 }}>
            <h3 className="font-bold m-0 mb-1" style={{ fontFamily: 'Playfair Display, serif', color: adminColors.navy }}>
              Extend Free Trial
            </h3>
            <p className="text-sm text-gray-500 m-0 mb-3">
              Adds days to the family trial end date in Supabase. No payment is charged.
            </p>
            <form onSubmit={(e) => void handleExtendTrial(e)} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select style={adminInput} value={trialUserId} onChange={(e) => setTrialUserId(e.target.value)} required>
                <option value="">Select family…</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                style={adminInput}
                value={trialDays}
                onChange={(e) => setTrialDays(Number(e.target.value))}
                placeholder="Extra days"
                required
              />
              <input style={adminInput} placeholder="Reason (optional)" value={trialReason} onChange={(e) => setTrialReason(e.target.value)} />
              <button type="submit" style={adminBtn.primary} disabled={saving || !trialUserId}>
                {saving ? 'Saving…' : 'Extend Trial'}
              </button>
            </form>
          </div>

          {loading ? (
            <TableSkeleton rows={4} cols={5} />
          ) : trials.length === 0 ? (
            <div style={adminCard}><EmptyState message="No trial extensions yet." /></div>
          ) : (
            <div style={{ ...adminCard, padding: 0, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
                <thead>
                  <tr>
                    {['Date', 'Family', 'Extra Days', 'Trial Ends', 'Reason'].map((h) => (
                      <th key={h} style={adminTableTh}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {trials.map((t) => (
                    <tr key={t.id}>
                      <td style={adminTableTd}>{formatDateTime(t.created_at)}</td>
                      <td style={adminTableTd}>{t.user?.full_name ?? t.user?.email}</td>
                      <td style={adminTableTd}>+{t.extra_days}</td>
                      <td style={adminTableTd}>{formatDateTime(t.trial_ends_at)}</td>
                      <td style={adminTableTd}>{t.reason ?? '—'}</td>
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
