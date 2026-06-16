import { Link } from 'react-router-dom'
import { useAuth } from '@/components/ProtectedRoute'
import { useSelectedChild } from '@/context/SelectedChildContext'
import ParentGateLink from '@/components/parent/ParentGateLink'
import { useSignOut } from '@/hooks/useSignOut'

export interface NavAuthActionStyles {
  signIn: string
  startFree: string
  myChildren: string
  parentDashboard: string
  signOut: string
  mobileSignIn?: string
  mobileStartFree?: string
  mobileMyChildren?: string
  mobileParentDashboard?: string
  mobileSignOut?: string
}

const DEFAULT_STYLES: NavAuthActionStyles = {
  signIn: 'px-4 py-1.5 border-2 border-[#1B2F5E] text-[#1B2F5E] rounded-full text-sm font-bold hover:opacity-80 transition-opacity',
  startFree:
    'px-4 py-1.5 bg-[#2AAFA0] text-white rounded-full text-sm font-bold hover:opacity-90 transition-opacity',
  myChildren:
    'px-4 py-1.5 border-2 border-[#1B2F5E] text-[#1B2F5E] rounded-full text-sm font-bold hover:opacity-80 transition-opacity',
  parentDashboard:
    'px-4 py-1.5 border-2 border-[#2AAFA0] text-[#2AAFA0] rounded-full text-sm font-bold hover:opacity-80 transition-opacity',
  signOut:
    'px-4 py-1.5 bg-[#2AAFA0] text-white rounded-full text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-60',
  mobileSignIn: 'block text-center py-2 border-2 border-navy text-navy rounded-full font-bold',
  mobileStartFree: 'block text-center py-2 bg-[#2AAFA0] text-white rounded-full font-bold',
  mobileMyChildren: 'block text-center py-2 border-2 border-navy text-navy rounded-full font-bold',
  mobileParentDashboard: 'block text-center py-2 border-2 border-[#2AAFA0] text-[#2AAFA0] rounded-full font-bold',
  mobileSignOut: 'block w-full text-center py-2 bg-[#2AAFA0] text-white rounded-full font-bold disabled:opacity-60',
}

function AuthLoadingPlaceholder({ layout }: { layout: 'desktop' | 'mobile' }) {
  if (layout === 'mobile') {
    return (
      <div className="space-y-3" aria-hidden>
        <div className="h-10 bg-gray-100 animate-pulse rounded-full" />
        <div className="h-10 bg-gray-100 animate-pulse rounded-full" />
        <div className="h-10 bg-gray-100 animate-pulse rounded-full" />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3" aria-hidden>
      <div className="h-9 w-[7.5rem] bg-gray-100 animate-pulse rounded-full" />
      <div className="h-9 w-[7.5rem] bg-gray-100 animate-pulse rounded-full" />
      <div className="h-9 w-[6.5rem] bg-gray-100 animate-pulse rounded-full" />
    </div>
  )
}

function ParentDashboardLink({
  className,
  onNavigate,
  useGate,
}: {
  className: string
  onNavigate?: () => void
  useGate: boolean
}) {
  if (useGate) {
    return (
      <ParentGateLink to="/parent/dashboard" className={className} onClick={onNavigate}>
        Parent Dashboard
      </ParentGateLink>
    )
  }
  return (
    <Link to="/parent/dashboard" className={className} onClick={onNavigate}>
      Parent Dashboard
    </Link>
  )
}

export default function NavAuthActions({
  layout = 'desktop',
  styles = DEFAULT_STYLES,
  onNavigate,
}: {
  layout?: 'desktop' | 'mobile'
  styles?: NavAuthActionStyles
  onNavigate?: () => void
}) {
  const { user, loading } = useAuth()
  const { selectedChild } = useSelectedChild()
  const { signOut, signingOut } = useSignOut()
  const gateDashboard = Boolean(selectedChild)

  if (loading) {
    return <AuthLoadingPlaceholder layout={layout} />
  }

  const handleSignOut = () => {
    onNavigate?.()
    void signOut()
  }

  if (user) {
    if (layout === 'mobile') {
      return (
        <>
          <Link
            to="/children"
            onClick={onNavigate}
            className={styles.mobileMyChildren ?? styles.myChildren}
          >
            My Children
          </Link>
          <ParentDashboardLink
            className={styles.mobileParentDashboard ?? styles.parentDashboard}
            onNavigate={onNavigate}
            useGate={gateDashboard}
          />
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className={styles.mobileSignOut ?? styles.signOut}
          >
            {signingOut ? 'Signing out…' : 'Sign Out'}
          </button>
        </>
      )
    }

    return (
      <>
        <Link to="/children" className={styles.myChildren}>
          My Children
        </Link>
        <ParentDashboardLink
          className={styles.parentDashboard}
          useGate={gateDashboard}
        />
        <button
          type="button"
          onClick={() => void signOut()}
          disabled={signingOut}
          className={styles.signOut}
        >
          {signingOut ? 'Signing out…' : 'Sign Out'}
        </button>
      </>
    )
  }

  if (layout === 'mobile') {
    return (
      <>
        <Link
          to="/login"
          onClick={onNavigate}
          className={styles.mobileSignIn ?? styles.signIn}
        >
          Sign In
        </Link>
        <Link
          to="/signup"
          onClick={onNavigate}
          className={styles.mobileStartFree ?? styles.startFree}
        >
          Start Free
        </Link>
      </>
    )
  }

  return (
    <>
      <Link to="/login" className={styles.signIn}>
        Sign In
      </Link>
      <Link to="/signup" className={styles.startFree}>
        Start Free
      </Link>
    </>
  )
}
