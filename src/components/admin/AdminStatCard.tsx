import { dashboardCard, dashboardTheme, kpiAccents } from '@/lib/admin/dashboardTheme'

type KpiKey = keyof typeof kpiAccents

interface AdminStatCardProps {
  label: string
  value: string | number
  accent?: KpiKey
  trend?: string
  subtitle?: string
  placeholder?: boolean
}

export default function AdminStatCard({
  label,
  value,
  accent = 'parents',
  trend = '0% from last 7 days',
  subtitle,
  placeholder,
}: AdminStatCardProps) {
  const a = kpiAccents[accent]

  return (
    <div style={{ ...dashboardCard, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: a.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            flexShrink: 0,
          }}
        >
          {a.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: dashboardTheme.muted, marginBottom: 4, fontWeight: 600 }}>{label}</div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: dashboardTheme.navy,
              fontFamily: 'Playfair Display, serif',
              lineHeight: 1.1,
            }}
          >
            {value}
          </div>
          {subtitle && <div style={{ fontSize: 12, color: dashboardTheme.muted, marginTop: 4 }}>{subtitle}</div>}
          {!placeholder && (
            <div style={{ fontSize: 11, color: dashboardTheme.teal, marginTop: 8, fontWeight: 600 }}>{trend}</div>
          )}
          {placeholder && (
            <div style={{ fontSize: 11, color: dashboardTheme.gold, marginTop: 8, fontWeight: 600 }}>Placeholder</div>
          )}
        </div>
      </div>
    </div>
  )
}
