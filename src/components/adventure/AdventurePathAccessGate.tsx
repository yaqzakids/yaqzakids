import { useEffect, useState, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '@/components/ProtectedRoute'
import { canAccessPath } from '@/lib/adventure/service'
import { supabase } from '@/lib/supabase'
import LoadingSpinner from '@/components/LoadingSpinner'
import LockedPremiumCard from '@/components/adventure/LockedPremiumCard'

/** Calls can_access_path RPC before rendering protected path content */
export default function AdventurePathAccessGate({ children }: { children: ReactNode }) {
  const { pathSlug } = useParams<{ pathSlug: string }>()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [accessible, setAccessible] = useState(false)
  const [pathTitle, setPathTitle] = useState('Premium Adventure Path')

  useEffect(() => {
    if (!pathSlug || !user) return
    let cancelled = false

    const check = async () => {
      setLoading(true)
      const { data: path } = await supabase
        .from('adventure_paths')
        .select('id, title')
        .eq('slug', pathSlug)
        .maybeSingle()

      if (cancelled) return

      if (!path) {
        setAccessible(false)
        setPathTitle('Path Not Found')
        setLoading(false)
        return
      }

      setPathTitle(path.title)
      const allowed = await canAccessPath(user.id, path.id)
      if (!cancelled) {
        setAccessible(allowed)
        setLoading(false)
      }
    }

    check()
    return () => { cancelled = true }
  }, [pathSlug, user?.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!accessible) {
    return <LockedPremiumCard title={pathTitle} />
  }

  return <>{children}</>
}
