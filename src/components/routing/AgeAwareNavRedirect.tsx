import { Navigate } from 'react-router-dom'
import { useSelectedChild } from '@/context/SelectedChildContext'
import { childNavPaths } from '@/lib/navLinks'

type NavTarget = 'achievements' | 'certificates' | 'journey' | 'profile' | 'profileAvatar' | 'home' | 'explore'

export default function AgeAwareNavRedirect({ target }: { target: NavTarget }) {
  const { selectedChild, loading } = useSelectedChild()

  if (loading) return null
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

  return <Navigate to={destination} replace />
}
