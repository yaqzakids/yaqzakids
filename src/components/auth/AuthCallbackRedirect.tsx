import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  hasAuthCallbackInUrl,
  authCallbackRouteWithCallback,
} from '@/lib/auth/authCallback'

/** Send Supabase auth tokens to the correct handler when they land on another route (e.g. Site URL `/`). */
export default function AuthCallbackRedirect() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (!hasAuthCallbackInUrl()) return
    if (location.pathname === '/verify-email' || location.pathname === '/reset-password') return

    navigate(authCallbackRouteWithCallback(), { replace: true })
  }, [location.pathname, location.search, location.hash, navigate])

  return null
}
