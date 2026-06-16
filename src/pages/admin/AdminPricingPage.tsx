import { FormEvent, useCallback, useEffect, useState } from 'react'
import StripeNotConnectedBanner from '@/components/admin/StripeNotConnectedBanner'
import { TableSkeleton } from '@/components/admin/AdminSkeleton'
import EmptyState from '@/components/admin/EmptyState'
import ErrorMessage from '@/components/ErrorMessage'
import {
  createDiscountCode,
  deleteDiscountCode,
  fetchDiscountCodes,
  formatDiscountValue,
  generateDiscountCode,
  toggleDiscountActive,
} from '@/lib/admin/discounts'
import { fetchAdminSubscriptionPlans, saveAdminSubscriptionPlan } from '@/lib/admin/pricing'
import {
  DEFAULT_SUBSCRIPTION_PLANS,
  SUBSCRIPTION_PLAN_IDS,
  type BillingPeriod,
  type SubscriptionPlanId,
  type SubscriptionPlansMap,
} from '@/lib/platform/subscriptionPlans'
import type { DiscountCode, DiscountType } from '@/types/payments'
import { adminBtn, adminCard, adminColors, adminInput, adminTableTd, adminTableTh } from '@/lib/admin/styles'
import { formatDate } from '@/lib/admin/utils'
import { formatSupabaseError } from '@/lib/supabaseErrors'

const PERIOD_OPTIONS: { value: BillingPeriod; label: string }[] = [
  { value: 'forever', label: 'Forever' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
]

const APPLIES_TO_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All plans' },
  { value: 'family_monthly', label: 'Family Monthly' },
  { value: 'family_yearly', label: 'Family Yearly' },
  { value: 'school', label: 'School' },
]

const goldBtn = { ...adminBtn.primary, background: adminColors.gold, borderColor: adminColors.gold }

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className="relative inline-flex h-6 w-11 shrink-0 rounded-full border-0 p-0 cursor-pointer transition-colors"
        style={{ background: checked ? adminColors.gold : '#D1D5DB' }}
      >
        <span
          className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
          style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)' }}
        />
      </button>
      <span>{label}</span>
    </label>
  )
}

export default function AdminPricingPage() {
  const [plans, setPlans] = useState<SubscriptionPlansMap>({ ...DEFAULT_SUBSCRIPTION_PLANS })
  const [codes, setCodes] = useState<DiscountCode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingPlanId, setSavingPlanId] = useState<SubscriptionPlanId | null>(null)
  const [creatingPromo, setCreatingPromo] = useState(false)

  const [promoForm, setPromoForm] = useState({
    code: '',
    discount_type: 'percentage' as DiscountType,
    discount_value: 10,
    applies_to: 'all',
    valid_from: '',
    valid_until: '',
    max_uses: '' as number | '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [planRows, codeRows] = await Promise.all([fetchAdminSubscriptionPlans(), fetchDiscountCodes()])
      setPlans(planRows)
      setCodes(codeRows)
    } catch (err) {
      setError(formatSupabaseError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const updatePlan = (id: SubscriptionPlanId, patch: Partial<SubscriptionPlansMap[SubscriptionPlanId]>) => {
    setPlans((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }

  const updateFeature = (id: SubscriptionPlanId, index: number, value: string) => {
    setPlans((prev) => {
      const features = [...prev[id].features]
      features[index] = value
      return { ...prev, [id]: { ...prev[id], features } }
    })
  }

  const addFeature = (id: SubscriptionPlanId) => {
    setPlans((prev) => ({
      ...prev,
      [id]: { ...prev[id], features: [...prev[id].features, ''] },
    }))
  }

  const removeFeature = (id: SubscriptionPlanId, index: number) => {
    setPlans((prev) => ({
      ...prev,
      [id]: { ...prev[id], features: prev[id].features.filter((_, i) => i !== index) },
    }))
  }

  const handleSavePlan = async (id: SubscriptionPlanId) => {
    setSavingPlanId(id)
    setError(null)
    try {
      const cleaned = {
        ...plans[id],
        features: plans[id].features.map((f) => f.trim()).filter(Boolean),
      }
      const next = { ...plans, [id]: cleaned }
      setPlans(next)
      await saveAdminSubscriptionPlan(id, next)
    } catch (err) {
      setError(formatSupabaseError(err))
    } finally {
      setSavingPlanId(null)
    }
  }

  const handleCreatePromotion = async (e: FormEvent) => {
    e.preventDefault()
    setCreatingPromo(true)
    setError(null)
    try {
      const allPaidPlans = ['family_monthly', 'family_yearly', 'school']
      const appliesToAll = promoForm.applies_to === 'all'

      await createDiscountCode({
        code: promoForm.code.trim() || generateDiscountCode(),
        discount_type: promoForm.discount_type,
        discount_value: promoForm.discount_value,
        max_uses: promoForm.max_uses === '' ? null : Number(promoForm.max_uses),
        plan: appliesToAll ? null : promoForm.applies_to,
        eligible_plans: appliesToAll ? allPaidPlans : undefined,
        valid_from: promoForm.valid_from || null,
        valid_until: promoForm.valid_until || null,
        is_active: true,
      })
      setPromoForm({
        code: '',
        discount_type: 'percentage',
        discount_value: 10,
        applies_to: 'all',
        valid_from: '',
        valid_until: '',
        max_uses: '',
      })
      await load()
    } catch (err) {
      setError(formatSupabaseError(err))
    } finally {
      setCreatingPromo(false)
    }
  }

  return (
    <div className="space-y-8">
      <StripeNotConnectedBanner />
      {error && <ErrorMessage message={error} onRetry={() => void load()} />}

      <section>
        <h2
          className="font-bold text-xl mb-4"
          style={{ fontFamily: 'Playfair Display, serif', color: adminColors.navy }}
        >
          Subscription Plans
        </h2>
        {loading ? (
          <TableSkeleton rows={2} cols={2} />
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {SUBSCRIPTION_PLAN_IDS.map((id) => {
              const plan = plans[id]
              return (
                <div key={id} style={adminCard}>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h3 className="font-bold m-0 capitalize" style={{ color: adminColors.navy }}>
                      {plan.name}
                    </h3>
                    <ToggleSwitch
                      checked={plan.is_active}
                      onChange={(is_active) => updatePlan(id, { is_active })}
                      label="Is Active"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className="text-sm block">
                      Plan name
                      <input
                        style={{ ...adminInput, marginTop: 4 }}
                        value={plan.name}
                        onChange={(e) => updatePlan(id, { name: e.target.value })}
                      />
                    </label>
                    <label className="text-sm block">
                      Price
                      <div className="relative mt-1">
                        <span
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
                          style={{ color: adminColors.muted }}
                        >
                          $
                        </span>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          style={{ ...adminInput, paddingLeft: 28 }}
                          value={plan.price}
                          onChange={(e) => updatePlan(id, { price: Number(e.target.value) })}
                        />
                      </div>
                    </label>
                    <label className="text-sm block">
                      Billing period
                      <select
                        style={{ ...adminInput, marginTop: 4 }}
                        value={plan.period === 'one-time' ? 'year' : plan.period}
                        onChange={(e) => updatePlan(id, { period: e.target.value as BillingPeriod })}
                      >
                        {PERIOD_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-sm block">
                      Stripe Price ID
                      <input
                        style={{ ...adminInput, marginTop: 4 }}
                        placeholder="price_..."
                        value={plan.stripe_price_id}
                        onChange={(e) => updatePlan(id, { stripe_price_id: e.target.value })}
                      />
                    </label>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">Features</span>
                      <button type="button" style={adminBtn.secondary} onClick={() => addFeature(id)}>
                        + Add feature
                      </button>
                    </div>
                    <div className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            style={{ ...adminInput, flex: 1 }}
                            value={feature}
                            onChange={(e) => updateFeature(id, index, e.target.value)}
                          />
                          <button type="button" style={adminBtn.danger} onClick={() => removeFeature(id, index)}>
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    style={{ ...goldBtn, marginTop: 16 }}
                    disabled={savingPlanId === id}
                    onClick={() => void handleSavePlan(id)}
                  >
                    {savingPlanId === id ? 'Saving…' : 'Save Plan'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section>
        <h2
          className="font-bold text-xl mb-4"
          style={{ fontFamily: 'Playfair Display, serif', color: adminColors.navy }}
        >
          Active Promotions
        </h2>
        <div style={{ ...adminCard, marginBottom: 16 }}>
          <form onSubmit={(e) => void handleCreatePromotion(e)} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            <div>
              <label className="text-sm block mb-1">Promo code</label>
              <div className="flex gap-2">
                <input
                  style={{ ...adminInput, flex: 1 }}
                  placeholder="YAQZA-XXXXXX"
                  value={promoForm.code}
                  onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                />
                <button
                  type="button"
                  style={adminBtn.secondary}
                  onClick={() => setPromoForm({ ...promoForm, code: generateDiscountCode() })}
                >
                  Auto-generate
                </button>
              </div>
            </div>
            <label className="text-sm block">
              Discount type
              <select
                style={{ ...adminInput, marginTop: 4 }}
                value={promoForm.discount_type}
                onChange={(e) => setPromoForm({ ...promoForm, discount_type: e.target.value as DiscountType })}
              >
                <option value="percentage">Percentage %</option>
                <option value="fixed">Fixed $</option>
              </select>
            </label>
            <label className="text-sm block">
              Discount value
              <input
                type="number"
                min={0}
                step={promoForm.discount_type === 'percentage' ? 1 : 0.01}
                style={{ ...adminInput, marginTop: 4 }}
                value={promoForm.discount_value}
                onChange={(e) => setPromoForm({ ...promoForm, discount_value: Number(e.target.value) })}
              />
            </label>
            <label className="text-sm block">
              Applies to
              <select
                style={{ ...adminInput, marginTop: 4 }}
                value={promoForm.applies_to}
                onChange={(e) => setPromoForm({ ...promoForm, applies_to: e.target.value })}
              >
                {APPLIES_TO_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm block">
              Valid from
              <input
                type="date"
                style={{ ...adminInput, marginTop: 4 }}
                value={promoForm.valid_from}
                onChange={(e) => setPromoForm({ ...promoForm, valid_from: e.target.value })}
              />
            </label>
            <label className="text-sm block">
              Valid until
              <input
                type="date"
                style={{ ...adminInput, marginTop: 4 }}
                value={promoForm.valid_until}
                onChange={(e) => setPromoForm({ ...promoForm, valid_until: e.target.value })}
              />
            </label>
            <label className="text-sm block">
              Max uses
              <input
                type="number"
                min={1}
                style={{ ...adminInput, marginTop: 4 }}
                placeholder="Unlimited"
                value={promoForm.max_uses}
                onChange={(e) =>
                  setPromoForm({ ...promoForm, max_uses: e.target.value === '' ? '' : Number(e.target.value) })
                }
              />
            </label>
            <div className="flex items-end">
              <button type="submit" style={goldBtn} disabled={creatingPromo}>
                {creatingPromo ? 'Creating…' : 'Create Promotion'}
              </button>
            </div>
          </form>
        </div>

        {loading ? (
          <TableSkeleton rows={4} cols={6} />
        ) : codes.length === 0 ? (
          <div style={adminCard}>
            <EmptyState message="No promotions yet." />
          </div>
        ) : (
          <div style={{ ...adminCard, padding: 0, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
              <thead>
                <tr>
                  {['Code', 'Type', 'Value', 'Valid Until', 'Uses / Max', 'Active', ''].map((h) => (
                    <th key={h || 'actions'} style={adminTableTh}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {codes.map((c) => (
                  <tr key={c.id}>
                    <td style={adminTableTd}>
                      <code>{c.code}</code>
                    </td>
                    <td style={adminTableTd}>
                      {c.discount_type === 'percentage' ? 'Percentage %' : 'Fixed $'}
                    </td>
                    <td style={adminTableTd}>{formatDiscountValue(c.discount_type, c.discount_value)}</td>
                    <td style={adminTableTd}>{formatDate(c.valid_until)}</td>
                    <td style={adminTableTd}>
                      {c.uses_count}/{c.max_uses ?? '∞'}
                    </td>
                    <td style={adminTableTd}>
                      <ToggleSwitch
                        checked={c.is_active}
                        onChange={async (is_active) => {
                          await toggleDiscountActive(c.id, is_active)
                          await load()
                        }}
                        label=""
                      />
                    </td>
                    <td style={adminTableTd}>
                      <button
                        type="button"
                        style={adminBtn.danger}
                        onClick={async () => {
                          if (window.confirm('Delete this promotion?')) {
                            await deleteDiscountCode(c.id)
                            await load()
                          }
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2
          className="font-bold text-xl mb-4"
          style={{ fontFamily: 'Playfair Display, serif', color: adminColors.navy }}
        >
          Preview
        </h2>
        <div style={adminCard}>
          <a href="/pricing" target="_blank" rel="noreferrer" style={{ ...goldBtn, display: 'inline-block', textDecoration: 'none' }}>
            View Live Pricing Page →
          </a>
        </div>
      </section>
    </div>
  )
}
