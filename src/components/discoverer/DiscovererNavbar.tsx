import { useAuth } from '@/components/ProtectedRoute'
import { useSelectedChild } from '@/context/SelectedChildContext'
import SignedInDiscovererNav from '@/components/discoverer/SignedInDiscovererNav'
import PublicNav from '@/components/layout/PublicNav'

export default function DiscovererNavbar({ forcePublic = false }: { forcePublic?: boolean }) {
  const { user, loading: authLoading } = useAuth()
  const { selectedChild, loading: childLoading } = useSelectedChild()

  if (forcePublic || authLoading || childLoading) {
    return <PublicNav />
  }

  if (user && selectedChild) {
    return <SignedInDiscovererNav />
  }

  return <PublicNav />
}
