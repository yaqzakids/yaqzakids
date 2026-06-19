import { Link } from 'react-router-dom'
import PublicLayout from '@/components/layout/PublicLayout'
import PageSeo from '@/components/seo/PageSeo'
import { GAMES, gameHref } from '@/lib/games'

export default function GamesPage() {
  return (
    <PublicLayout bg="bg-[#EEF4FF]">
      <PageSeo
        title="Games & Challenges"
        description="Learn through play. Earn stars. Challenge yourself."
        path="/games"
      />
      <div className="max-w-5xl mx-auto px-5 md:px-8 py-12 md:py-16">
        <header className="mb-12 text-center max-w-3xl mx-auto">
          <h1
            className="font-display font-bold text-[#1B2F5E] leading-tight mb-4"
            style={{ fontSize: '40px' }}
          >
            Games &amp; Challenges
          </h1>
          <p className="text-lg text-[#1B2F5E]/75 font-semibold">
            Learn through play. Earn stars. Challenge yourself.
          </p>
        </header>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {GAMES.map((game) => (
            <div
              key={game.slug}
              className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm flex flex-col text-center"
            >
              <span className="text-5xl mb-4 block">{game.icon}</span>
              <h2 className="font-display text-xl font-bold text-[#1B2F5E] mb-2">{game.name}</h2>
              <p className="text-sm text-[#6B7280] flex-1 mb-5">{game.description}</p>
              <Link
                to={gameHref(game)}
                className="inline-flex justify-center px-6 py-2.5 bg-[#F5A623] text-white rounded-full text-sm font-extrabold hover:opacity-90"
              >
                Play Now →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </PublicLayout>
  )
}
