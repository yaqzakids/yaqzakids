import { Link } from 'react-router-dom'
import { useAuth } from '@/components/ProtectedRoute'
import { useSelectedChild } from '@/context/SelectedChildContext'
import { useParentGate } from '@/context/ParentGateContext'
import { isParentUnlocked } from '@/lib/parentGate'

interface ParentGateLinkProps extends React.ComponentPropsWithoutRef<typeof Link> {
  to: string
}

/** Link that opens the parent gate when navigating from an active child session */
export default function ParentGateLink({ to, onClick, ...rest }: ParentGateLinkProps) {
  const { user } = useAuth()
  const { selectedChild } = useSelectedChild()
  const { openParentGate } = useParentGate()

  return (
    <Link
      {...rest}
      to={to}
      onClick={(e) => {
        onClick?.(e)
        if (e.defaultPrevented) return
        if (selectedChild && user && !isParentUnlocked()) {
          e.preventDefault()
          openParentGate(to)
        }
      }}
    />
  )
}
