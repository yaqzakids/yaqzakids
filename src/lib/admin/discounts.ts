import { supabase } from '@/lib/supabase'
import { logAdminAction } from './activity'
import type { DiscountCode, DiscountCodeInput, DiscountType } from '@/types/payments'

export type { DiscountCode, DiscountCodeInput, DiscountType } from '@/types/payments'

/** DB may store legacy "percent" — always use percentage/fixed in the app. */
export function normalizeDiscountType(value: string): DiscountType {
  if (value === 'percent' || value === 'percentage') return 'percentage'
  if (value === 'fixed') return 'fixed'
  return 'percentage'
}

function normalizeRow(row: Record<string, unknown>): DiscountCode {
  return {
    id: String(row.id),
    code: String(row.code),
    discount_type: normalizeDiscountType(String(row.discount_type ?? 'percentage')),
    discount_value: Number(row.discount_value ?? 0),
    plan: row.plan != null ? String(row.plan) : null,
    eligible_plans: Array.isArray(row.eligible_plans) ? (row.eligible_plans as string[]) : null,
    max_uses: row.max_uses != null ? Number(row.max_uses) : null,
    uses_count: Number(row.uses_count ?? 0),
    valid_from: row.valid_from != null ? String(row.valid_from) : null,
    valid_until: row.valid_until != null ? String(row.valid_until) : null,
    is_active: Boolean(row.is_active),
    created_at: String(row.created_at),
  }
}

function toInsertPayload(input: DiscountCodeInput): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    code: input.code.trim().toUpperCase(),
    discount_type: normalizeDiscountType(input.discount_type),
    discount_value: input.discount_value,
    max_uses: input.max_uses ?? null,
    valid_from: input.valid_from || null,
    valid_until: input.valid_until || null,
    is_active: input.is_active ?? true,
  }

  if (input.eligible_plans?.length) {
    payload.eligible_plans = input.eligible_plans
    payload.plan = null
  } else {
    payload.plan = input.plan || null
  }

  return payload
}

export async function fetchDiscountCodes(): Promise<DiscountCode[]> {
  const { data, error } = await supabase.from('discount_codes').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => normalizeRow(row as Record<string, unknown>))
}

export async function createDiscountCode(input: DiscountCodeInput): Promise<void> {
  const payload = toInsertPayload(input)
  const { data, error } = await supabase.from('discount_codes').insert(payload).select('id').single()
  if (error) throw error
  await logAdminAction('discount_created', 'discount', data.id, { code: payload.code as string })
}

export async function toggleDiscountActive(id: string, is_active: boolean): Promise<void> {
  const { error } = await supabase.from('discount_codes').update({ is_active }).eq('id', id)
  if (error) throw error
  await logAdminAction(is_active ? 'discount_activated' : 'discount_deactivated', 'discount', id)
}

export async function deleteDiscountCode(id: string): Promise<void> {
  const { error } = await supabase.from('discount_codes').delete().eq('id', id)
  if (error) throw error
  await logAdminAction('discount_deleted', 'discount', id)
}

export function generateDiscountCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'YAQZA-'
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export function formatDiscountValue(type: DiscountType, value: number): string {
  return type === 'percentage' ? `${value}%` : `$${value}`
}
