import { Link, Navigate, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { authUrl } from '@/lib/navigation'
import { AdminRoleContext, getPermissions, parseAdminRole, type AdminRole } from '@/context/AdminRoleContext'
import { checkIsAdmin, linkAdminUserAccount } from '@/lib/admin/adminUsers'

type AdminRouteStatus = 'loading' | 'admin' | 'not-admin' | 'not-logged-in'

export default function AdminRoute() {
  const [status, setStatus] = useState<AdminRouteStatus>('loading')
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null)

  useEffect(() => {
    const check = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setStatus('not-logged-in')
        return
      }

      try {
        await linkAdminUserAccount()
        const isAdmin = await checkIsAdmin()
        if (!isAdmin) {
          setStatus('not-admin')
          return
        }

        const { data: rpcRole } = await supabase.rpc('get_admin_role')
        setAdminRole(parseAdminRole(rpcRole) ?? 'admin')
        setStatus('admin')
      } catch {
        setStatus('not-admin')
      }
    }
    void check()
  }, [])

  if (status === 'loading') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F8FAFC',
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            border: '3px solid #d1d5db',
            borderTopColor: '#1B2F5E',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (status === 'not-logged-in') {
    return <Navigate to={authUrl('/login', '/admin')} replace />
  }

  if (status === 'not-admin') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 20,
          background: '#F8FAFC',
          padding: 24,
        }}
      >
        <h1
          style={{
            fontFamily: 'Playfair Display, serif',
            color: '#1B2F5E',
            fontSize: 32,
            margin: 0,
            textAlign: 'center',
          }}
        >
          Access Denied
        </h1>
        <p style={{ color: '#6B7280', margin: 0, textAlign: 'center', maxWidth: 480, lineHeight: 1.6 }}>
          You do not have permission to access this page.
        </p>
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            padding: '12px 24px',
            background: '#2AAFA0',
            color: '#fff',
            borderRadius: 999,
            fontWeight: 800,
            textDecoration: 'none',
            fontSize: 14,
          }}
        >
          Back to Homepage
        </Link>
      </div>
    )
  }

  if (!adminRole) {
    return null
  }

  return (
    <AdminRoleContext.Provider value={{ adminRole, ...getPermissions(adminRole) }}>
      <Outlet />
    </AdminRoleContext.Provider>
  )
}
