import type { ReactNode } from 'react'
import { SiteFooter } from '@/components/SiteFooter'
import LoadingSpinner from '@/components/LoadingSpinner'
import { useAuth } from '@/components/ProtectedRoute'
import { useSelectedChild } from '@/context/SelectedChildContext'
import SignedInChildHome from '@/components/childHome/SignedInChildHome'
import { STORAGE_KEYS } from '@/lib/adventure/constants'
import type { AgeGroup, ChildProfile } from '@/lib/types'

export interface AgeHomeShellProps {
  ageGroup: AgeGroup
  pageBg?: string
  footerVariant?: 'light' | 'dark'
  /** When true, signed-out content renders its own nav/footer (e.g. AgeHomepage). */
  signedOutIncludesChrome?: boolean
  signedOutContent: ReactNode
  signedOutFooter?: ReactNode
}

/** Resolve active child synchronously (localStorage updates before React state after pick). */
function resolveActiveChild(
  selectedChild: ChildProfile | null,
  children: ChildProfile[]
): ChildProfile | null {
  if (selectedChild) return selectedChild
  const storedId =
    localStorage.getItem(STORAGE_KEYS.activeChild) ??
    localStorage.getItem(STORAGE_KEYS.selectedChildId)
  if (!storedId) return null
  return children.find((c) => c.id === storedId) ?? null
}

export default function AgeHomeShell({
  ageGroup,
  pageBg = 'bg-[#EEF4FF]',
  footerVariant = 'light',
  signedOutIncludesChrome = false,
  signedOutContent,
  signedOutFooter,
}: AgeHomeShellProps) {
  const { user } = useAuth()
  const { selectedChild, children, loading: childLoading } = useSelectedChild()

  const activeChild = resolveActiveChild(selectedChild, children)
  const isSignedInChildHome = Boolean(
    user && activeChild && activeChild.age_group === ageGroup
  )

  const showFooter = isSignedInChildHome || !signedOutIncludesChrome
  const resolvedPageBg = isSignedInChildHome ? 'bg-[#EEF4FF]' : pageBg
  const waitingForChild = Boolean(user && childLoading)

  return (
    <div className={`min-h-screen ${resolvedPageBg} page-transition flex flex-col`}>
      {!isSignedInChildHome && !waitingForChild && signedOutContent}

      <div className="max-w-[1280px] mx-auto px-5 md:px-8 pb-16 flex-1 w-full">
        {waitingForChild && (
          <div className="py-24 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {isSignedInChildHome && activeChild && (
          <SignedInChildHome ageGroup={ageGroup} selectedChild={activeChild} userId={user?.id ?? null} />
        )}

        {!isSignedInChildHome && !waitingForChild && signedOutFooter}
      </div>

      {showFooter && <SiteFooter variant={isSignedInChildHome ? 'light' : footerVariant} />}
    </div>
  )
}
