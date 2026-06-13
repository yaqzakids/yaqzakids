import { useAuth } from '@/components/ProtectedRoute'
import { useSelectedChild } from '@/context/SelectedChildContext'
import SignedOutDiscovererNav from '@/components/discoverer/SignedOutDiscovererNav'
import SignedInDiscovererNav from '@/components/discoverer/SignedInDiscovererNav'

export default function DiscovererNavbar() {
  const { user, loading: authLoading } = useAuth()
  const { selectedChild, loading: childLoading } = useSelectedChild()

  if (authLoading || childLoading) {
    return <SignedOutDiscovererNav />
  }

  if (user && selectedChild) {
    return <SignedInDiscovererNav />
  }

  return <SignedOutDiscovererNav />
}
