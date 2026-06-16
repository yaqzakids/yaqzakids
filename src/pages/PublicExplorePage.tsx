import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PublicLayout from '@/components/layout/PublicLayout'
import LoadingSpinner from '@/components/LoadingSpinner'
import PageSeo from '@/components/seo/PageSeo'
import { LEARNING_PATHS } from '@/lib/learningPaths'
import { fetchSampleDiscovererArticles } from '@/lib/discoverer'
import type { AdventureArticle } from '@/lib/adventure/types'

interface FeaturedArticle {
  article: AdventureArticle
  url: string | null
  pathName: string
}

export default function PublicExplorePage() {
  const [articles, setArticles] = useState<FeaturedArticle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchSampleDiscovererArticles()
      .then((items) => {
        if (!cancelled) setArticles(items.slice(0, 3))
      })
      .catch(() => {
        if (!cancelled) setArticles([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <PublicLayout bg="bg-[#EEF4FF]">
      <PageSeo
        title="Explore"
        description="Explore stories, science, history and faith — all in one place on YaqzaKids."
        path="/explore"
      />
      <div className="max-w-7xl mx-auto px-5 md:px-8 py-12 md:py-16">
        <header className="mb-12 text-center max-w-3xl mx-auto">
          <h1
            className="font-display font-bold text-[#1B2F5E] leading-tight mb-4"
            style={{ fontSize: '40px' }}
          >
            Explore Allah&apos;s World
          </h1>
          <p className="text-lg text-[#1B2F5E]/75 font-semibold">
            Explore stories, science, history and faith — all in one place
          </p>
        </header>

        <section className="mb-14">
          <h2 className="font-display text-2xl font-bold text-[#1B2F5E] mb-6">Featured Stories</h2>
          {loading ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map(({ article, url, pathName }) => (
                <div
                  key={article.id}
                  className="bg-white rounded-2xl shadow-sm overflow-hidden border border-[#E5E7EB] flex flex-col"
                >
                  {article.cover_image_url ? (
                    <img src={article.cover_image_url} alt="" className="w-full h-44 object-cover" />
                  ) : (
                    <div className="w-full h-44 bg-gradient-to-br from-[#EEF4FF] to-[#2AAFA0]/20" />
                  )}
                  <div className="p-5 flex flex-col flex-1">
                    <p className="text-[10px] font-extrabold text-[#2AAFA0] uppercase mb-1">{pathName}</p>
                    <h3 className="font-bold text-[#1B2F5E] text-base mb-2 line-clamp-2">{article.title}</h3>
                    <p className="text-sm text-[#6B7280] leading-relaxed flex-1 mb-4 line-clamp-3">
                      {article.excerpt ?? 'An engaging story to spark curiosity and reflection.'}
                    </p>
                    <Link
                      to={url ?? '/sample-stories'}
                      className="inline-flex justify-center px-5 py-2.5 bg-[#2AAFA0] text-white rounded-full text-sm font-extrabold hover:opacity-90"
                    >
                      Read Story →
                    </Link>
                  </div>
                </div>
              ))}
              {!loading && articles.length === 0 && (
                <p className="text-[#6B7280] col-span-full text-center py-8">Featured stories coming soon.</p>
              )}
            </div>
          )}
          <div className="mt-6 text-center">
            <Link to="/sample-stories" className="text-[#2AAFA0] text-sm font-extrabold hover:underline">
              View all sample stories →
            </Link>
          </div>
        </section>

        <section className="mb-14">
          <h2 className="font-display text-2xl font-bold text-[#1B2F5E] mb-6">Explore Learning Paths</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {LEARNING_PATHS.map((path) => (
              <Link
                key={path.slug}
                to={`/paths/${path.slug}`}
                className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <span className="text-2xl mb-2 block">{path.icon}</span>
                <h3 className="font-bold text-sm mb-2" style={{ color: path.color }}>
                  {path.name}
                </h3>
                <p className="text-xs text-[#6B7280] mb-3 line-clamp-2">{path.description}</p>
                <span className="text-[#2AAFA0] text-xs font-extrabold">Explore path →</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-[#E5E7EB] p-8 md:p-10 text-center max-w-3xl mx-auto">
          <p className="text-[#2AAFA0] text-xs font-extrabold tracking-widest uppercase mb-2">For Parents</p>
          <h2 className="font-display text-2xl font-bold text-[#1B2F5E] mb-3">
            Safe, meaningful learning for your child
          </h2>
          <p className="text-[#6B7280] leading-relaxed mb-6">
            Track progress, manage child profiles, and explore a curriculum rooted in Islamic values — without ads
            or distractions.
          </p>
          <Link
            to="/signup"
            className="inline-flex px-8 py-3 bg-[#F5A623] text-white rounded-full text-sm font-extrabold hover:opacity-90"
          >
            Sign Up Free →
          </Link>
        </section>
      </div>
    </PublicLayout>
  )
}
