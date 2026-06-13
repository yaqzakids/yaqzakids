import { Link } from 'react-router-dom'
import { dashboardCard, dashboardTheme } from '@/lib/admin/dashboardTheme'

interface AdminComingSoonPageProps {
  title: string
  description?: string
  backTo?: { label: string; path: string }
}

export default function AdminComingSoonPage({
  title,
  description = 'This section is coming soon. Check back in a future update.',
  backTo,
}: AdminComingSoonPageProps) {
  return (
    <div style={{ ...dashboardCard, maxWidth: 560, margin: '40px auto', textAlign: 'center', padding: '48px 32px' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div>
      <h2
        style={{
          margin: '0 0 12px',
          fontFamily: 'Playfair Display, serif',
          color: dashboardTheme.navy,
          fontSize: 28,
        }}
      >
        {title}
      </h2>
      <p style={{ margin: '0 0 8px', color: dashboardTheme.muted, lineHeight: 1.6 }}>{description}</p>
      <p
        style={{
          margin: '0 0 24px',
          fontSize: 13,
          fontWeight: 700,
          color: dashboardTheme.gold,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        Coming Soon
      </p>
      {backTo && (
        <Link
          to={backTo.path}
          style={{
            display: 'inline-block',
            padding: '10px 20px',
            background: dashboardTheme.gold,
            color: dashboardTheme.sidebar,
            borderRadius: 10,
            fontWeight: 700,
            textDecoration: 'none',
            fontSize: 14,
          }}
        >
          ← {backTo.label}
        </Link>
      )}
    </div>
  )
}
