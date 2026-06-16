import { Link } from 'react-router-dom'
import PublicLayout from '@/components/layout/PublicLayout'
import PageSeo from '@/components/seo/PageSeo'
import type { GameSlug } from '@/lib/games'
import { gameBySlug } from '@/lib/games'

export default function GamePlaceholder({ slug }: { slug: GameSlug }) {
  const game = gameBySlug(slug)
  if (!game) return null

  return (
    <PublicLayout bg="bg-[#EEF4FF]">
      <PageSeo title={game.name} description={game.description} path={`/games/${slug}`} />
      <div className="max-w-2xl mx-auto px-5 py-16 text-center">
        <div className="text-7xl mb-6">{game.icon}</div>
        <h1 className="font-display font-bold text-[#1B2F5E] mb-4" style={{ fontSize: '36px' }}>
          {game.name}
        </h1>
        <p className="text-lg text-[#6B7280] mb-8">{game.description}</p>
        <span className="inline-block px-5 py-2 bg-[#F5A623] text-white rounded-full text-sm font-extrabold mb-10">
          Coming Soon
        </span>
        <div>
          <Link to="/games" className="text-[#2AAFA0] font-extrabold hover:underline">
            ← Back to Games
          </Link>
        </div>
      </div>
    </PublicLayout>
  )
}
