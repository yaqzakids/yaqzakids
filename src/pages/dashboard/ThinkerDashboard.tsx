import AgeProfileDashboard from '@/components/childHome/AgeProfileDashboard'
import { SiteFooter } from '@/components/SiteFooter'
import { useAuth } from '@/components/ProtectedRoute'
import { useSelectedChild } from '@/context/SelectedChildContext'

export default function ThinkerDashboard() {
  const { user } = useAuth()
  const { selectedChild } = useSelectedChild()

  if (!selectedChild) return null

  return (
    <div className="min-h-screen bg-navy page-transition flex flex-col">
      <div className="flex-1 bg-[#EEF4FF]">
        <AgeProfileDashboard ageGroup="thinker" selectedChild={selectedChild} userId={user?.id ?? null} />
      </div>
      <SiteFooter variant="dark" />
    </div>
  )
}
