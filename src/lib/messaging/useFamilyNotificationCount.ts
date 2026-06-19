import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/components/ProtectedRoute'
import { fetchFamilyNotificationCount } from '@/lib/messaging/familyFeed'

export function useFamilyNotificationCount(pollMs = 30000) {
  const { user } = useAuth()
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) {
      setCount(0)
      setLoading(false)
      return
    }
    try {
      setCount(await fetchFamilyNotificationCount(user.id))
    } catch {
      setCount(0)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    void refresh()
    if (!user || pollMs <= 0) return
    const id = window.setInterval(() => void refresh(), pollMs)
    return () => window.clearInterval(id)
  }, [user, pollMs, refresh])

  return { count, loading, refresh }
}
