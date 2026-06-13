import { Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { authUrl, currentPathWithSearch } from '@/lib/navigation'
import { isOnboardingPath, resolveOnboardingPath } from '@/lib/onboarding'
import type { User } from '@supabase/supabase-js'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [user, setUser] = useState<User | null | undefined>(undefined)
  const [onboardingPath, setOnboardingPath] = useState<string | null | undefined>(undefined)
  const location = useLocation()

  useEffect(() => {
    let active = true

    const sync = async (nextUser: User | null) => {
      setUser(nextUser)
      if (!nextUser) {
        if (active) setOnboardingPath(null)
        return
      }
      const next = await resolveOnboardingPath(nextUser.id, nextUser)
      if (active) setOnboardingPath(next)
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      void sync(session?.user ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void sync(session?.user ?? null)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  if (user === undefined || (user && onboardingPath === undefined)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin-slow" />
      </div>
    )
  }

  if (!user) {
    return (
      <Navigate
        to={authUrl('/login', currentPathWithSearch(location))}
        replace
      />
    )
  }

  if (
    onboardingPath &&
    !isOnboardingPath(location.pathname, location.search) &&
    currentPathWithSearch(location) !== onboardingPath
  ) {
    return <Navigate to={onboardingPath} replace />
  }

  return <>{children}</>
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}
