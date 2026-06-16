import type { ReactNode } from 'react'
import ParentPasscodeGate from '@/components/parent/ParentPasscodeGate'

/** Blocks parent-only routes until passcode verification when a child is active */
export default function ParentGateRoute({ children }: { children: ReactNode }) {
  return <ParentPasscodeGate>{children}</ParentPasscodeGate>
}
