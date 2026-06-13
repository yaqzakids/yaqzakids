import { useEffect, useState } from 'react'
import { fetchAllHeroCards, fetchChildHeroCards } from '@/lib/adventure/service'
import type { ChildHeroCard, HeroCard } from '@/lib/adventure/types'
import LoadingSpinner from '@/components/LoadingSpinner'

interface HeroCardCollectionProps {
  childId: string | null
}

export default function HeroCardCollection({ childId }: HeroCardCollectionProps) {
  const [allCards, setAllCards] = useState<HeroCard[]>([])
  const [unlocked, setUnlocked] = useState<ChildHeroCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchAllHeroCards(), childId ? fetchChildHeroCards(childId) : Promise.resolve([])])
      .then(([cards, childCards]) => {
        setAllCards(cards)
        setUnlocked(childCards)
      })
      .finally(() => setLoading(false))
  }, [childId])

  if (loading) return <LoadingSpinner size="sm" />

  const unlockedIds = new Set(unlocked.map((c) => c.hero_card_id))

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {allCards.map((card) => {
        const isUnlocked = unlockedIds.has(card.id)
        return (
          <div
            key={card.id}
            className={`rounded-2xl overflow-hidden border-2 shadow-sm transition-transform hover:-translate-y-1 ${
              isUnlocked ? 'border-gold bg-white' : 'border-gray-200 bg-gray-100'
            }`}
          >
            {card.image_url && (
              <img
                src={card.image_url}
                alt={card.name}
                className={`w-full h-36 object-cover ${isUnlocked ? '' : 'blur-sm opacity-50'}`}
              />
            )}
            <div className="p-3 text-center">
              <p className="font-bold text-navy text-sm">{isUnlocked ? card.name : '???'}</p>
              <p className="text-xs text-muted mt-1">
                {isUnlocked ? card.description : 'Complete a path to unlock'}
              </p>
            </div>
          </div>
        )
      })}
      {allCards.length === 0 && (
        <p className="col-span-full text-center text-muted py-8">Hero cards coming soon!</p>
      )}
    </div>
  )
}
