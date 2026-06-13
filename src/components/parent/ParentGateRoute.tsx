import { useEffect, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/components/ProtectedRoute'
import { useSelectedChild } from '@/context/SelectedChildContext'
import { useParentGate } from '@/context/ParentGateContext'
import ParentGateModal from '@/components/parent/ParentGateModal'
import LoadingSpinner from '@/components/LoadingSpinner'
import { isParentUnlocked, unlockParentSession } from '@/lib/parentGate'

/** Blocks parent-only routes until PIN/password verification when a child is active */
export default function ParentGateRoute({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const { selectedChild, loading: childLoading } = useSelectedChild()
  const { refreshUnlock } = useParentGate()
  const location = useLocation()
  const navigate = useNavigate()
  const [unlocked, setUnlocked] = useState(isParentUnlocked())

  useEffect(() => {
    setUnlocked(isParentUnlocked())
  }, [location.pathname])

  const needsGate = Boolean(selectedChild && user && !unlocked)

  const handleSuccess = () => {
    unlockParentSession()
    refreshUnlock()
    setUnlocked(true)
  }

  const handleCancel = () => {
    navigate(selectedChild ? dashboardFallback(selectedChild.age_group) : '/children', {
      replace: true,
    })
  }

  if (authLoading || childLoading) {
    return (
      <div className="min-h-screen bg-[#EEF4FF] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (needsGate) {
    return (
      <ParentGateModal
        open
        onClose={handleCancel}
        onSuccess={handleSuccess}
        returnPath={location.pathname}
      />
    )
  }

  return <>{children}</>
}

function dashboardFallback(ageGroup: string): string {
  if (ageGroup === 'explorer') return '/explorer/dashboard'
  if (ageGroup === 'thinker') return '/thinker/dashboard'
  return '/discoverer'
}
