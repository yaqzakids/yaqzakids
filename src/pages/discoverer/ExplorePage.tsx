import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import DiscovererPageShell from '@/components/discoverer/DiscovererPageShell'
import LoadingSpinner from '@/components/LoadingSpinner'
import { supabase } from '@/lib/supabase'
import { resolveArticleUrl } from '@/lib/discoverer'
import type { AdventureArticle } from '@/lib/adventure/types'

function ExploreArticleCard({ article }: { article: AdventureArticle }) {
  const [url, setUrl] = useState('/discoverer/explore')
  useEffect(() => {
    resolveArticleUrl(article.id).then((u) => {
      if (u) setUrl(u)
    })
  }, [article.id])

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
      {article.cover_image_url ? (
        <img src={article.cover_image_url} alt="" className="w-full h-40 object-cover" />
      ) : (
        <div className="w-full h-40 bg-gradient-to-br from-[#EEF4FF] to-teal/20" />
      )}
      <div className="p-4">
        <h2 className="font-bold text-navy line-clamp-2 mb-2">{article.title}</h2>
        <p className="text-xs text-muted mb-3">{article.reading_time_minutes} min read</p>
        <Link
          to={url}
          className="block text-center py-2 bg-teal text-white rounded-full text-sm font-extrabold"
        >
          Read
        </Link>
      </div>
    </div>
  )
}

export default function ExplorePage() {
  const [articles, setArticles] = useState<AdventureArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      const { data, error: err } = await supabase
        .from('articles')
        .select('*')
        .eq('published', true)
        .order('title')
      if (cancelled) return
      if (err) setError('Could not load stories.')
      else setArticles((data ?? []) as AdventureArticle[])
      setLoading(false)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return articles
    return articles.filter((a) => a.title.toLowerCase().includes(q))
  }, [articles, search])

  return (
    <DiscovererPageShell>
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-10">
        <h1 className="font-display text-3xl font-bold text-navy mb-2">Explore Stories</h1>
        <p className="text-muted mb-6">Browse all stories for curious Discoverers.</p>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search stories…"
          className="w-full max-w-md px-4 py-3 border border-gray-200 rounded-full mb-8 focus:border-teal focus:outline-none"
        />

        {loading && (
          <div className="py-16 flex justify-center">
            <LoadingSpinner />
          </div>
        )}
        {error && <p className="text-coral font-bold">{error}</p>}

        {!loading && !error && filtered.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
            <p className="text-muted">No stories found. Check back soon!</p>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((a) => (
            <ExploreArticleCard key={a.id} article={a} />
          ))}
        </div>
      </div>
    </DiscovererPageShell>
  )
}
