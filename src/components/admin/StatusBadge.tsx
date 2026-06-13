import { adminColors } from '@/lib/admin/styles'

type BadgeVariant = 'success' | 'muted' | 'warning' | 'danger' | 'gold'

const variants: Record<BadgeVariant, { bg: string; color: string }> = {
  success: { bg: adminColors.successBg, color: adminColors.success },
  muted: { bg: '#f3f4f6', color: adminColors.muted },
  warning: { bg: '#fef3c7', color: '#92400e' },
  danger: { bg: adminColors.dangerBg, color: adminColors.danger },
  gold: { bg: '#fef3c7', color: '#b45309' },
}

export default function StatusBadge({ label, variant = 'muted' }: { label: string; variant?: BadgeVariant }) {
  const v = variants[variant]
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        background: v.bg,
        color: v.color,
      }}
    >
      {label}
    </span>
  )
}
