import { supabase } from '@/lib/supabase'

export const SUBSCRIPTION_PLAN_IDS = [
  'free',
  'family_monthly',
  'family_yearly',
  'school',
] as const

export type SubscriptionPlanId = (typeof SUBSCRIPTION_PLAN_IDS)[number]

export type BillingPeriod = 'forever' | 'month' | 'year' | 'one-time'

export interface SubscriptionPlanRecord {
  name: string
  price: number
  period: BillingPeriod
  description: string
  features: string[]
  is_active: boolean
  stripe_price_id: string
}

export type SubscriptionPlansMap = Record<SubscriptionPlanId, SubscriptionPlanRecord>

export const SUBSCRIPTION_PLANS_KEY = 'subscription_plans'

export const DEFAULT_SUBSCRIPTION_PLANS: SubscriptionPlansMap = {
  free: {
    name: 'Free',
    price: 0,
    period: 'forever',
    description: 'Get started with essential learning content.',
    features: ['5 articles per month', 'All 3 languages'],
    is_active: true,
    stripe_price_id: '',
  },
  family_monthly: {
    name: 'Family Monthly',
    price: 9.99,
    period: 'month',
    description: 'Full access for your whole family, billed monthly.',
    features: ['Unlimited articles', 'All 3 languages', 'Parent dashboard', 'Up to 3 children'],
    is_active: true,
    stripe_price_id: '',
  },
  family_yearly: {
    name: 'Family Yearly',
    price: 79.99,
    period: 'year',
    description: 'Best value for families committed to learning all year.',
    features: ['Save 33%', 'All features included'],
    is_active: true,
    stripe_price_id: '',
  },
  school: {
    name: 'School',
    price: 299,
    period: 'year',
    description: 'For classrooms and homeschool groups.',
    features: ['Up to 30 students', 'Teacher dashboard', 'All features'],
    is_active: true,
    stripe_price_id: '',
  },
}

export interface PricingPlanDisplay {
  id: SubscriptionPlanId
  badge: string
  badgeColor: string
  name: string
  price: string
  period: string
  description: string
  highlighted: boolean
  borderColor: string
  features: { text: string; included: boolean }[]
  buttonText: string
  buttonStyle: string
  save?: string
}

const PLAN_UI: Record<
  SubscriptionPlanId,
  Pick<PricingPlanDisplay, 'badge' | 'badgeColor' | 'buttonText' | 'buttonStyle' | 'borderColor' | 'highlighted'>
> = {
  free: {
    badge: 'FREE FOREVER',
    badgeColor: 'bg-teal/10 text-teal',
    buttonText: 'Get Started',
    buttonStyle: 'outline-teal',
    borderColor: '',
    highlighted: false,
  },
  family_monthly: {
    badge: 'MOST POPULAR',
    badgeColor: 'bg-gold/10 text-[#D4820A]',
    buttonText: 'Start Monthly',
    buttonStyle: 'gold',
    borderColor: 'border-2 border-gold',
    highlighted: true,
  },
  family_yearly: {
    badge: 'BEST VALUE',
    badgeColor: 'bg-coral/10 text-coral',
    buttonText: 'Start Yearly',
    buttonStyle: 'outline-gold',
    borderColor: '',
    highlighted: false,
  },
  school: {
    badge: 'FOR EDUCATORS',
    badgeColor: 'bg-purple/10 text-purple',
    buttonText: 'Contact Us',
    buttonStyle: 'outline-purple',
    borderColor: '',
    highlighted: false,
  },
}

function formatPrice(amount: number): string {
  if (amount === 0) return '$0'
  return amount % 1 === 0 ? `$${amount}` : `$${amount.toFixed(2)}`
}

function formatPeriod(period: BillingPeriod): string {
  if (period === 'month') return '/month'
  if (period === 'year') return '/year'
  if (period === 'one-time') return ' one-time'
  return ''
}

export function parseSubscriptionPlans(raw: string | null | undefined): SubscriptionPlansMap {
  if (!raw) return { ...DEFAULT_SUBSCRIPTION_PLANS }
  try {
    const parsed = JSON.parse(raw) as Partial<SubscriptionPlansMap>
    const merged = { ...DEFAULT_SUBSCRIPTION_PLANS }
    for (const id of SUBSCRIPTION_PLAN_IDS) {
      if (parsed[id]) {
        merged[id] = { ...merged[id], ...parsed[id], features: parsed[id]?.features ?? merged[id].features }
      }
    }
    return merged
  } catch {
    return { ...DEFAULT_SUBSCRIPTION_PLANS }
  }
}

export function plansToDisplay(plans: SubscriptionPlansMap): PricingPlanDisplay[] {
  return SUBSCRIPTION_PLAN_IDS.filter((id) => plans[id]?.is_active !== false).map((id) => {
    const plan = plans[id]
    const ui = PLAN_UI[id]
    const saveFeature = plan.features.find((f) => f.toLowerCase().includes('save'))
    return {
      id,
      ...ui,
      name: plan.name,
      price: formatPrice(plan.price),
      period: formatPeriod(plan.period),
      description: plan.description,
      features: plan.features.map((text) => ({ text, included: true })),
      save: id === 'family_yearly' && saveFeature ? saveFeature : undefined,
    }
  })
}

export async function fetchSubscriptionPlans(): Promise<SubscriptionPlansMap> {
  const { data, error } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', SUBSCRIPTION_PLANS_KEY)
    .maybeSingle()

  if (error) throw error
  return parseSubscriptionPlans(data?.value)
}

export async function saveSubscriptionPlans(plans: SubscriptionPlansMap): Promise<void> {
  const { error } = await supabase.from('platform_settings').upsert(
    {
      key: SUBSCRIPTION_PLANS_KEY,
      value: JSON.stringify(plans),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' }
  )
  if (error) throw error
}
