import { useEffect, useState } from 'react'
import { useAuth } from '@/components/ProtectedRoute'
import {
  dismissAnnouncement,
  fetchActiveAnnouncementsForParent,
} from '@/lib/messaging/parentMessaging'
import type { AnnouncementWithDismissed } from '@/lib/messaging/types'

interface AnnouncementBannerProps {
  compact?: boolean
}

export default function AnnouncementBanner({ compact = false }: AnnouncementBannerProps) {
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState<AnnouncementWithDismissed[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (!user) return
    setLoading(true)
    try {
      const items = await fetchActiveAnnouncementsForParent(user.id)
      setAnnouncements(items.filter((a) => !a.dismissed))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [user])

  if (loading || announcements.length === 0) return null

  const handleDismiss = async (id: string) => {
    if (!user) return
    await dismissAnnouncement(user.id, id)
    setAnnouncements((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <div className={compact ? 'space-y-2 mb-4' : 'space-y-3 mb-8'}>
      {announcements.map((a) => (
        <div
          key={a.id}
          className="rounded-2xl border-2 border-gold/40 bg-gold/10 p-4 md:p-5 relative"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wide text-gold mb-1 m-0">
                📢 Announcement
              </p>
              <h3 className="font-display font-bold text-navy m-0 mb-1">{a.title}</h3>
              <p className="text-sm text-navy m-0 whitespace-pre-wrap">{a.message}</p>
            </div>
            <button
              type="button"
              onClick={() => void handleDismiss(a.id)}
              className="shrink-0 text-xs font-bold text-muted hover:text-navy bg-transparent border-0 cursor-pointer"
              aria-label="Dismiss announcement"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
