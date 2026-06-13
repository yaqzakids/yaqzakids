export type PaymentRecordStatus = 'pending' | 'succeeded' | 'failed' | 'refunded'
export type PaymentRecordType = 'subscription' | 'one_time' | 'manual_note'
export type PaymentSource = 'internal' | 'stripe'
export type FailedPaymentStatus = 'open' | 'resolved' | 'waived'
export type RefundStatus = 'pending' | 'approved' | 'rejected' | 'processed'
export type DiscountType = 'percentage' | 'fixed'
export type PaymentsAdminTab = 'overview' | 'records' | 'failed' | 'access'
export type DiscountsAdminTab = 'coupons' | 'trials'

export interface PaymentOverview {
  activeSubscriptions: number
  paidSubscriptions: number
  freeSubscriptions: number
  cancelledSubscriptions: number
  openFailedPayments: number
  pendingRefunds: number
  byPlan: Record<string, number>
}

export interface PaymentRecordRow {
  id: string
  user_id: string | null
  amount_cents: number
  currency: string
  status: PaymentRecordStatus
  record_type: PaymentRecordType
  description: string
  source: PaymentSource
  stripe_payment_intent_id: string | null
  stripe_invoice_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  user?: { full_name: string; email: string | null } | null
}

export interface FailedPaymentRow {
  id: string
  user_id: string | null
  subscription_id: string | null
  amount_cents: number
  currency: string
  failure_reason: string
  stripe_event_id: string | null
  status: FailedPaymentStatus
  admin_notes: string | null
  recorded_by: string | null
  created_at: string
  resolved_at: string | null
  user?: { full_name: string; email: string | null } | null
}

export interface ManualAccessGrantRow {
  id: string
  user_id: string
  subscription_id: string | null
  plan: string
  end_date: string | null
  reason: string | null
  granted_by: string | null
  created_at: string
  user?: { full_name: string; email: string | null } | null
}

export interface AdminRefundRow {
  id: string
  ticket_id: string
  amount: number
  reason: string
  requested_by: string | null
  status: RefundStatus
  admin_notes: string | null
  stripe_refund_id: string | null
  processed_at: string | null
  created_at: string
  updated_at: string
  ticket?: {
    ticket_number: string
    subject: string
    parent_id: string
    parent?: { full_name: string; email: string | null } | null
  } | null
  requester?: { full_name: string; email: string | null } | null
}

export interface RefundStats {
  pending: number
  approved: number
  processed: number
  rejected: number
  totalAmountPending: number
}

export interface DiscountCode {
  id: string
  code: string
  discount_type: DiscountType
  discount_value: number
  plan: string | null
  eligible_plans?: string[] | null
  max_uses: number | null
  uses_count: number
  valid_from: string | null
  valid_until: string | null
  is_active: boolean
  created_at: string
}

export interface DiscountCodeInput {
  code: string
  discount_type: DiscountType
  discount_value: number
  plan?: string | null
  eligible_plans?: string[] | null
  max_uses?: number | null
  valid_from?: string | null
  valid_until?: string | null
  is_active?: boolean
}

export interface TrialExtensionRow {
  id: string
  user_id: string
  extra_days: number
  trial_ends_at: string
  reason: string | null
  granted_by: string | null
  created_at: string
  user?: { full_name: string; email: string | null } | null
}

export interface AdminUserOption {
  id: string
  full_name: string
  email: string | null
}
