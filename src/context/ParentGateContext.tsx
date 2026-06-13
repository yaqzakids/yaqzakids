import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import ParentGateModal from '@/components/parent/ParentGateModal'
import { isParentUnlocked, unlockParentSession } from '@/lib/parentGate'

interface ParentGateContextValue {
  /** True when a child session is active and parent area is not unlocked */
  needsParentGate: boolean
  openParentGate: (returnPath?: string) => void
  /** Re-check unlock state after successful gate */
  refreshUnlock: () => void
}

const ParentGateContext = createContext<ParentGateContextValue | null>(null)

export function ParentGateProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [unlockTick, setUnlockTick] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [returnPath, setReturnPath] = useState<string | null>(null)

  const needsParentGate = unlockTick >= 0 && !isParentUnlocked()

  const refreshUnlock = useCallback(() => {
    setUnlockTick((t) => t + 1)
  }, [])

  const openParentGate = useCallback((path?: string) => {
    setReturnPath(path ?? null)
    setModalOpen(true)
  }, [])

  const handleSuccess = useCallback(() => {
    unlockParentSession()
    refreshUnlock()
    setModalOpen(false)
    if (returnPath) {
      navigate(returnPath)
      setReturnPath(null)
    }
  }, [refreshUnlock, returnPath, navigate])

  return (
    <ParentGateContext.Provider
      value={{ needsParentGate, openParentGate, refreshUnlock }}
    >
      {children}
      <ParentGateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleSuccess}
        returnPath={returnPath}
      />
    </ParentGateContext.Provider>
  )
}

export function useParentGate() {
  const ctx = useContext(ParentGateContext)
  if (!ctx) throw new Error('useParentGate must be used within ParentGateProvider')
  return ctx
}

/** Whether parent-only content should be gated for the current session */
export function useRequiresParentGate(hasActiveChild: boolean): boolean {
  const { needsParentGate } = useParentGate()
  return hasActiveChild && needsParentGate
}
