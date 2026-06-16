import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/components/ProtectedRoute'
import { useSelectedChild } from '@/context/SelectedChildContext'
import { useParentGate } from '@/context/ParentGateContext'
import { dashboardPathForAgeGroup } from '@/lib/childProfiles'
import { isParentUnlocked, unlockParentSession } from '@/lib/parentGate'

export function useParentPasscodeGate(options?: {
  alwaysRequire?: boolean
  onCancelPath?: string
}) {
  const { user, loading: authLoading } = useAuth()
  const { selectedChild, loading: childLoading } = useSelectedChild()
  const { refreshUnlock } = useParentGate()
  const navigate = useNavigate()
  const [unlocked, setUnlocked] = useState(isParentUnlocked())

  useEffect(() => {
    setUnlocked(isParentUnlocked())
  }, [selectedChild?.id])

  const alwaysRequire = options?.alwaysRequire ?? false
  const needsGate = Boolean(user && !unlocked && (alwaysRequire || selectedChild))

  const handleSuccess = () => {
    unlockParentSession()
    refreshUnlock()
    setUnlocked(true)
  }

  const handleCancel = () => {
    if (options?.onCancelPath) {
      navigate(options.onCancelPath, { replace: true })
      return
    }
    if (selectedChild) {
      navigate(dashboardPathForAgeGroup(selectedChild.age_group), { replace: true })
      return
    }
    navigate('/children', { replace: true })
  }

  return {
    loading: authLoading || childLoading,
    needsGate,
    handleSuccess,
    handleCancel,
  }
}
