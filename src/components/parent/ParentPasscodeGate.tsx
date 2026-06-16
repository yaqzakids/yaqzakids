import type { ReactNode } from 'react'
import ParentGateModal from '@/components/parent/ParentGateModal'
import LoadingSpinner from '@/components/LoadingSpinner'
import { useParentPasscodeGate } from '@/hooks/useParentPasscodeGate'

export interface ParentPasscodeGateProps {
  children: ReactNode
  /** When true, passcode is required even without an active child session. */
  alwaysRequire?: boolean
  title?: string
  description?: string
  onCancelPath?: string
}

export default function ParentPasscodeGate({
  children,
  alwaysRequire = false,
  title,
  description,
  onCancelPath,
}: ParentPasscodeGateProps) {
  const { loading, needsGate, handleSuccess, handleCancel } = useParentPasscodeGate({
    alwaysRequire,
    onCancelPath,
  })

  if (loading) {
    return (
      <div className="min-h-[240px] flex items-center justify-center">
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
        title={title}
        description={description}
      />
    )
  }

  return <>{children}</>
}
