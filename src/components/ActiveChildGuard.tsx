import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '@/components/ProtectedRoute'
import { useSelectedChild } from '@/context/SelectedChildContext'
import LoadingSpinner from '@/components/LoadingSpinner'
import { authUrl, childrenPickerUrl, currentPathWithSearch } from '@/lib/navigation'

/** Requires signed-in parent with an active child profile selected */
export default function ActiveChildGuard({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const { selectedChild, loading: childLoading } = useSelectedChild()
  const location = useLocation()

  if (authLoading || childLoading) {
    return (
      <div className="min-h-screen bg-[#EEF4FF] flex items-center justify-center">
        <LoadingSpinner size="lg" />
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

  if (!selectedChild) {
    return (
      <Navigate
        to={childrenPickerUrl(currentPathWithSearch(location))}
        replace
      />
    )
  }

  return <>{children}</>
}
