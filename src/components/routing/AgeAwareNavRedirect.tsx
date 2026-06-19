import { Navigate, useLocation } from 'react-router-dom'
import { useSelectedChild } from '@/context/SelectedChildContext'
import LoadingSpinner from '@/components/LoadingSpinner'
import { childNavPaths } from '@/lib/navLinks'

type NavTarget = 'achievements' | 'certificates' | 'journey' | 'profile' | 'profileAvatar' | 'home' | 'explore'

export default function AgeAwareNavRedirect({ target }: { target: NavTarget }) {
  const { selectedChild, loading } = useSelectedChild()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EEF4FF] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!selectedChild) return <Navigate to="/children" replace />

  const paths = childNavPaths(selectedChild)
  const destination =
    target === 'home'
      ? paths.home
      : target === 'explore'
        ? paths.explore
        : target === 'achievements'
          ? paths.achievements
          : target === 'certificates'
            ? paths.certificates
            : target === 'journey'
              ? paths.journey
              : target === 'profileAvatar'
                ? paths.profileAvatar
                : paths.profile

  const [destPath, destSearch = ''] = destination.split('?')
  const currentSearch = location.search.startsWith('?') ? location.search.slice(1) : location.search
  if (location.pathname === destPath && currentSearch === destSearch) {
    return <Navigate to={paths.home} replace />
  }

  return <Navigate to={destination} replace />
}
