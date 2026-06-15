import { useEffect, useState, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '@/components/ProtectedRoute'
import { useSelectedChild } from '@/context/SelectedChildContext'
import { fetchChildArticlePathAccess } from '@/lib/adventure/service'
import LoadingSpinner from '@/components/LoadingSpinner'
import LockedPremiumCard from '@/components/adventure/LockedPremiumCard'
import LockedSequentialCard from '@/components/adventure/LockedSequentialCard'

/** Checks subscription access and per-child sequential path progression before rendering article content. */
export default function AdventureArticleAccessGate({ children }: { children: ReactNode }) {
  const { pathSlug, articleSlug } = useParams<{ pathSlug: string; articleSlug: string }>()
  const { user } = useAuth()
  const { selectedChild } = useSelectedChild()
  const [loading, setLoading] = useState(true)
  const [access, setAccess] = useState<Awaited<ReturnType<typeof fetchChildArticlePathAccess>> | null>(
    null,
  )

  useEffect(() => {
    if (!pathSlug || !articleSlug || !user || !selectedChild) return
    let cancelled = false

    const check = async () => {
      setLoading(true)
      const result = await fetchChildArticlePathAccess(
        pathSlug,
        articleSlug,
        selectedChild.id,
        user.id,
      )
      if (!cancelled) {
        setAccess(result)
        setLoading(false)
      }
    }

    void check()
    return () => {
      cancelled = true
    }
  }, [pathSlug, articleSlug, user?.id, selectedChild?.id])

  if (!user || !selectedChild) {
    return (
      <LockedPremiumCard
        title="Sign in required"
        subtitle="Choose a child profile to read adventure lessons."
      />
    )
  }

  if (loading || !access) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!access.allowed && access.reason === 'premium') {
    return (
      <LockedPremiumCard
        title={access.articleTitle ?? 'Premium Article'}
        subtitle="This article requires a Family Plan. Upgrade to unlock all adventure paths and premium content."
      />
    )
  }

  if (!access.allowed && access.reason === 'sequential') {
    return (
      <LockedSequentialCard
        articleTitle={access.articleTitle ?? 'Locked lesson'}
        pathTitle={access.pathTitle}
        pathSlug={access.pathSlug}
        previousArticle={access.previousArticle}
      />
    )
  }

  if (!access.allowed) {
    return (
      <LockedPremiumCard
        title="Article not found"
        subtitle="This lesson could not be found in the selected learning path."
      />
    )
  }

  return <>{children}</>
}
