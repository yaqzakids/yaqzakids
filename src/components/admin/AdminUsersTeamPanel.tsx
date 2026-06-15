import { Link } from 'react-router-dom'
import { useAdminRole } from '@/context/AdminRoleContext'
import { adminCard } from '@/lib/admin/styles'
import { MAIN_ADMIN_EMAIL } from '@/lib/constants'

/** Owner-only summary with link to full team management page */
export default function AdminUsersTeamPanel() {
  const { isOwner } = useAdminRole()

  if (!isOwner) return null

  return (
    <div style={{ ...adminCard, marginBottom: 24 }}>
      <h2 style={{ margin: '0 0 8px', fontFamily: 'Playfair Display, serif', color: '#1B2F5E' }}>
        Team / Employee Accounts
      </h2>
      <p style={{ margin: '0 0 16px', color: '#6B7280', fontSize: 14, lineHeight: 1.6 }}>
        Create and manage admin, editor, reviewer, and support logins. Only {MAIN_ADMIN_EMAIL} can add team
        members.
      </p>
      <Link
        to="/admin/team"
        style={{
          display: 'inline-flex',
          padding: '10px 18px',
          background: '#2AAFA0',
          color: '#fff',
          borderRadius: 999,
          fontWeight: 800,
          textDecoration: 'none',
          fontSize: 14,
        }}
      >
        Manage team accounts →
      </Link>
    </div>
  )
}
