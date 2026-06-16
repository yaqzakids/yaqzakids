import AgeProfileDashboard from '@/components/childHome/AgeProfileDashboard'
import { SiteFooter } from '@/components/SiteFooter'
import { useAuth } from '@/components/ProtectedRoute'
import { useSelectedChild } from '@/context/SelectedChildContext'

export default function ExplorerDashboard() {
  const { user } = useAuth()
  const { selectedChild } = useSelectedChild()

  if (!selectedChild) return null

  return (
    <div className="min-h-screen bg-[#FFF8ED] page-transition flex flex-col">
      <AgeProfileDashboard ageGroup="explorer" selectedChild={selectedChild} userId={user?.id ?? null} />
      <SiteFooter variant="light" />
    </div>
  )
}
