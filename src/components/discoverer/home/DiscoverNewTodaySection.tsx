import { Link } from 'react-router-dom'
import type { AdventureArticle } from '@/lib/adventure/types'
import type { DiscovererStoryCard } from '@/lib/discovererHomeContent'
import { resolveArticleUrl } from '@/lib/discoverer'
import { useEffect, useState } from 'react'

function articleToCard(article: AdventureArticle, url: string): DiscovererStoryCard {
  return {
    title: article.title,
    category: 'Recommended',
    description: article.excerpt ?? '',
    image: article.cover_image_url ?? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
    readingTime: article.reading_time_minutes,
    ageTag: `Ages ${article.age_min}–${article.age_max}`,
    starsReward: 15,
    url,
  }
}

function RecommendedCard({ card }: { card: DiscovererStoryCard }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#EEF4FF] overflow-hidden hover:shadow-md transition-shadow flex flex-col">
      <img src={card.image} alt="" className="w-full h-32 object-cover" />
      <div className="p-4 flex flex-col flex-1">
        <p className="text-[10px] font-extrabold text-[#2AAFA0] uppercase mb-1">{card.category}</p>
        <h3 className="font-bold text-[#1B2F5E] text-sm line-clamp-2 mb-2">{card.title}</h3>
        <p className="text-xs text-[#6B7280] mb-2">{card.readingTime} min read</p>
        {card.starsReward != null && (
          <p className="text-xs font-extrabold text-[#F5A623] mb-4">⭐ +{card.starsReward} stars</p>
        )}
        <Link
          to={card.url}
          className="mt-auto inline-flex justify-center px-4 py-2 bg-[#2AAFA0] text-white rounded-full text-sm font-extrabold hover:opacity-90"
        >
          Read Story →
        </Link>
      </div>
    </div>
  )
}

export default function DiscoverNewTodaySection({
  articles,
  fallbackCards,
  exploreRoute = '/discoverer/explore',
}: {
  articles: AdventureArticle[]
  fallbackCards: DiscovererStoryCard[]
  exploreRoute?: string
}) {
  const [cards, setCards] = useState<DiscovererStoryCard[]>(fallbackCards)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (articles.length === 0) {
        setCards(fallbackCards)
        return
      }
      const resolved = await Promise.all(
        articles.slice(0, 4).map(async (a) => {
          const url = (await resolveArticleUrl(a.id)) ?? '/discoverer/explore'
          return articleToCard(a, url)
        })
      )
      if (!cancelled) setCards(resolved)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [articles, fallbackCards])

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between gap-4 mb-2">
        <h2 className="font-display text-xl font-bold text-[#1B2F5E]">
          ✨ Discover Something New Today
        </h2>
        <Link to={exploreRoute} className="text-[#2AAFA0] text-sm font-extrabold shrink-0">
          Explore all →
        </Link>
      </div>
      <p className="text-sm text-[#6B7280] mb-5 max-w-2xl">
        Stories picked for your progress, age group, and learning journey.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <RecommendedCard key={card.title} card={card} />
        ))}
      </div>
    </section>
  )
}
