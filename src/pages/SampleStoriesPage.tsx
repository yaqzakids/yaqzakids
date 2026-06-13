import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import LoadingSpinner from '@/components/LoadingSpinner'
import { fetchSampleDiscovererArticles } from '@/lib/discoverer'
import type { AdventureArticle } from '@/lib/adventure/types'

interface SampleArticle {
  article: AdventureArticle
  url: string | null
  pathName: string
}

export default function SampleStoriesPage() {
  const [articles, setArticles] = useState<SampleArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchSampleDiscovererArticles()
      .then((items) => {
        if (!cancelled) setArticles(items)
      })
      .catch(() => {
        if (!cancelled) setError('Could not load sample stories.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#EEF4FF] page-transition flex flex-col">
      <SiteNav variant="discoverer" />
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-10">
        <p className="text-[#2AAFA0] text-xs font-extrabold tracking-widest uppercase mb-2">
          Free preview
        </p>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-[#1B2F5E] mb-3">
          Sample Stories for Discoverers
        </h1>
        <p className="text-[#1B2F5E]/70 max-w-2xl mb-8 leading-relaxed">
          Try a taste of YaqzaKids — exciting stories about science, nature, history, and faith.
          Create a free account to save progress, earn stars, and unlock your full adventure.
        </p>
        <Link
          to="/signup"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-extrabold text-white bg-[#2AAFA0] hover:opacity-90 shadow-md text-sm mb-10"
        >
          ✨ Start Free to unlock everything
        </Link>

        {loading && (
          <div className="py-16 flex justify-center">
            <LoadingSpinner />
          </div>
        )}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map(({ article, url, pathName }) => (
              <div
                key={article.id}
                className="bg-white rounded-2xl shadow-sm overflow-hidden border border-white"
              >
                {article.cover_image_url ? (
                  <img src={article.cover_image_url} alt="" className="w-full h-44 object-cover" />
                ) : (
                  <div className="w-full h-44 bg-gradient-to-br from-[#EEF4FF] to-[#2AAFA0]/20" />
                )}
                <div className="p-5">
                  <p className="text-[10px] font-extrabold text-[#2AAFA0] uppercase mb-1">
                    {pathName}
                  </p>
                  <h2 className="font-bold text-[#1B2F5E] line-clamp-2 mb-2">{article.title}</h2>
                  <p className="text-xs text-[#6B7280] mb-4">
                    {article.reading_time_minutes} min read · Ages 9–12
                  </p>
                  {url ? (
                    <Link
                      to={url}
                      className="block text-center py-2.5 bg-[#2AAFA0] text-white rounded-full text-sm font-extrabold hover:opacity-90"
                    >
                      Read Sample
                    </Link>
                  ) : (
                    <Link
                      to="/signup"
                      className="block text-center py-2.5 bg-[#1B2F5E] text-white rounded-full text-sm font-extrabold hover:opacity-90"
                    >
                      Sign up to read
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && !error && articles.length === 0 && (
          <p className="text-[#6B7280]">Sample stories coming soon.</p>
        )}
      </div>
      <SiteFooter variant="light" />
    </div>
  )
}
