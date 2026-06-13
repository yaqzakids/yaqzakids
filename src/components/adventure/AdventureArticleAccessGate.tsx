import { useEffect, useState, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '@/components/ProtectedRoute'
import { canAccessArticle } from '@/lib/adventure/service'
import { supabase } from '@/lib/supabase'
import LoadingSpinner from '@/components/LoadingSpinner'
import LockedPremiumCard from '@/components/adventure/LockedPremiumCard'

/** Calls can_access_article RPC before rendering protected article content */
export default function AdventureArticleAccessGate({ children }: { children: ReactNode }) {
  const { pathSlug, articleSlug } = useParams<{ pathSlug: string; articleSlug: string }>()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [accessible, setAccessible] = useState(false)
  const [articleTitle, setArticleTitle] = useState('Premium Article')

  useEffect(() => {
    if (!pathSlug || !articleSlug || !user) return
    let cancelled = false

    const check = async () => {
      setLoading(true)
      const { data: article } = await supabase
        .from('articles')
        .select('id, title')
        .eq('slug', articleSlug)
        .maybeSingle()

      if (cancelled) return

      if (!article) {
        setAccessible(false)
        setArticleTitle('Article Not Found')
        setLoading(false)
        return
      }

      setArticleTitle(article.title)
      const allowed = await canAccessArticle(user.id, article.id)
      if (!cancelled) {
        setAccessible(allowed)
        setLoading(false)
      }
    }

    check()
    return () => { cancelled = true }
  }, [pathSlug, articleSlug, user?.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!accessible) {
    return (
      <LockedPremiumCard
        title={articleTitle}
        subtitle="This article requires a Family Plan. Upgrade to unlock all adventure paths and premium content."
      />
    )
  }

  return <>{children}</>
}
