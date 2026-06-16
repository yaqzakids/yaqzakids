import { logAdminAction } from './activity'
import {
  fetchSubscriptionPlans,
  saveSubscriptionPlans,
  type SubscriptionPlanId,
  type SubscriptionPlansMap,
} from '@/lib/platform/subscriptionPlans'

export async function fetchAdminSubscriptionPlans(): Promise<SubscriptionPlansMap> {
  return fetchSubscriptionPlans()
}

export async function saveAdminSubscriptionPlan(
  planId: SubscriptionPlanId,
  plans: SubscriptionPlansMap
): Promise<void> {
  await saveSubscriptionPlans(plans)
  await logAdminAction('pricing_plan_updated', 'settings', undefined, { planId })
}

export async function saveAllSubscriptionPlans(plans: SubscriptionPlansMap): Promise<void> {
  await saveSubscriptionPlans(plans)
  await logAdminAction('pricing_plans_updated', 'settings', undefined, {
    planIds: Object.keys(plans),
  })
}
