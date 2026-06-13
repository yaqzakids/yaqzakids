import { dashboardCard, dashboardTheme } from '@/lib/admin/dashboardTheme'

interface AdminToastProps {
  message: string
  type: 'success' | 'error'
  onClose: () => void
}

export default function AdminToast({ message, type, onClose }: AdminToastProps) {
  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 2000,
        ...dashboardCard,
        padding: '14px 20px',
        borderColor: type === 'success' ? dashboardTheme.teal : '#FCA5A5',
        background: type === 'success' ? '#E6F7F5' : '#FEF2F2',
        boxShadow: dashboardTheme.shadow,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        maxWidth: 360,
      }}
    >
      <span>{type === 'success' ? '✅' : '⚠️'}</span>
      <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: dashboardTheme.navy }}>{message}</span>
      <button
        type="button"
        onClick={onClose}
        style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  )
}
