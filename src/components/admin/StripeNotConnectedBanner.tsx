import { adminColors } from '@/lib/admin/styles'
import { isStripeConnected, STRIPE_NOT_CONNECTED_MESSAGE } from '@/lib/stripe'

export default function StripeNotConnectedBanner() {
  if (isStripeConnected()) return null

  return (
    <div
      style={{
        marginBottom: 16,
        padding: '14px 16px',
        borderRadius: 8,
        border: `1.5px solid ${adminColors.gold}`,
        background: '#FFFBEB',
      }}
    >
      <p style={{ margin: 0, color: adminColors.navy, fontWeight: 700, fontSize: 14 }}>
        Stripe not connected yet
      </p>
      <p style={{ margin: '6px 0 0', color: adminColors.muted, fontSize: 13, lineHeight: 1.5 }}>
        {STRIPE_NOT_CONNECTED_MESSAGE}
      </p>
    </div>
  )
}
