/** True when a real Stripe publishable key is configured in the environment. */
export function isStripeConnected(): boolean {
  const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  if (!key || typeof key !== 'string') return false
  const trimmed = key.trim()
  if (!trimmed) return false
  if (trimmed.includes('your-') || trimmed.includes('placeholder')) return false
  return trimmed.startsWith('pk_')
}

export const STRIPE_NOT_CONNECTED_MESSAGE =
  'Stripe is not connected yet. Payment and refund actions are recorded internally only — no charges or refunds will be processed.'
