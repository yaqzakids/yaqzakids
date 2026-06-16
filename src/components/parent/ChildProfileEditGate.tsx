import type { ReactNode } from 'react'
import ParentPasscodeGate from '@/components/parent/ParentPasscodeGate'

/** Requires parent passcode for child profile edit/delete, even without active child session. */
export default function ChildProfileEditGate({ children }: { children: ReactNode }) {
  return (
    <ParentPasscodeGate alwaysRequire onCancelPath="/children">
      {children}
    </ParentPasscodeGate>
  )
}
