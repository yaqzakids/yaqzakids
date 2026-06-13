import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DiscovererPageShell from '@/components/discoverer/DiscovererPageShell'
import LoadingSpinner from '@/components/LoadingSpinner'
import { useSelectedChild } from '@/context/SelectedChildContext'
import { supabase } from '@/lib/supabase'
import type { AdventureArticle } from '@/lib/adventure/types'

export default function LibraryPage() {
  const { selectedChild, loading: childLoading } = useSelectedChild()
  const [articles, setArticles] = useState<AdventureArticle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (childLoading) return
    if (!selectedChild) {
      setLoading(false)
      return
    }
    let cancelled = false
    const load = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('article_progress')
        .select('article:articles(*)')
        .eq('child_profile_id', selectedChild.id)
        .eq('read_completed', true)
        .order('completed_at', { ascending: false })
      if (cancelled) return
      const list: AdventureArticle[] = []
      for (const row of data ?? []) {
        const article = row.article as unknown
        if (article && typeof article === 'object' && !Array.isArray(article) && 'id' in article) {
          list.push(article as AdventureArticle)
        }
      }
      setArticles(list)
      setLoading(false)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [selectedChild?.id, childLoading])

  if (childLoading || loading) {
    return (
      <DiscovererPageShell>
        <div className="py-24 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </DiscovererPageShell>
    )
  }

  return (
    <DiscovererPageShell>
      <div className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="font-display text-3xl font-bold text-navy mb-2">My Library</h1>
        <p className="text-muted mb-8">Stories you&apos;ve read and saved.</p>

        {!selectedChild ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
            <p className="text-navy font-bold mb-3">Sign in to see your saved stories.</p>
            <Link to="/login" className="text-teal font-extrabold">Sign in →</Link>
          </div>
        ) : articles.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
            <p className="text-4xl mb-3">📚</p>
            <p className="text-navy font-bold mb-2">Your library is empty</p>
            <p className="text-muted text-sm mb-4">Read a story to add it here.</p>
            <Link to="/discoverer/explore" className="text-teal font-extrabold">
              Explore stories →
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {articles.map((a) => (
              <div key={a.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4">
                {a.cover_image_url && (
                  <img src={a.cover_image_url} alt="" className="w-20 h-20 rounded-xl object-cover shrink-0" />
                )}
                <div>
                  <h2 className="font-bold text-navy text-sm">{a.title}</h2>
                  <p className="text-xs text-muted mt-1">{a.reading_time_minutes} min</p>
                  <Link to="/adventures" className="text-teal text-xs font-bold mt-2 inline-block">
                    Read again →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DiscovererPageShell>
  )
}
