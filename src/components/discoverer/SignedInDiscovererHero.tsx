import { Link } from 'react-router-dom'
import UserAvatar from '@/components/UserAvatar'
import TealProgressBar from '@/components/discoverer/TealProgressBar'
import DiscovererHeroShell from '@/components/discoverer/DiscovererHeroShell'

export interface SignedInDiscovererHeroProps {
  childName: string
  avatarId: string | null
  levelNumber: number
  levelName: string
  missionDone: { read: boolean; quiz: boolean; reflection: boolean }
  lastArticle: { title: string; url: string; statusLabel: string } | null
}

export default function SignedInDiscovererHero({
  childName,
  avatarId,
  levelNumber,
  levelName,
  missionDone,
  lastArticle,
}: SignedInDiscovererHeroProps) {
  const missionComplete = [missionDone.read, missionDone.quiz, missionDone.reflection].filter(Boolean).length

  return (
    <DiscovererHeroShell>
      <div className="max-w-2xl">
        <div className="flex items-center gap-4 mb-5">
          <UserAvatar name={childName} avatarId={avatarId} size={56} />
          <div>
            <h1 className="font-display font-bold text-[#1B2F5E] text-[clamp(1.5rem,3vw,40px)] leading-tight">
              Welcome back, {childName}! 👋
            </h1>
            <p className="text-[#1B2F5E]/70 text-sm font-semibold mt-1">
              Level {levelNumber} · {levelName}
            </p>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 mb-6 max-w-md shadow-sm border border-white">
          <p className="font-bold text-[#1B2F5E] text-sm mb-2 flex items-center justify-between gap-2">
            <span>🎯 Today&apos;s Mission</span>
            <span className="text-[#2AAFA0]">{missionComplete}/3</span>
          </p>
          {missionComplete === 0 ? (
            <p className="text-[12px] text-[#6B7280] font-semibold">Start your first mission today!</p>
          ) : (
            <>
              <TealProgressBar value={Math.round((missionComplete / 3) * 100)} className="mb-2" />
              <ul className="space-y-1 text-[12px] text-[#1B2F5E] font-semibold">
                <li>{missionDone.read ? '✅' : '⭕'} Read a story</li>
                <li>{missionDone.quiz ? '✅' : '⭕'} Pass a quiz</li>
                <li>{missionDone.reflection ? '✅' : '⭕'} Answer a reflection</li>
              </ul>
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/discoverer/mission"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full font-extrabold text-white bg-[#2AAFA0] hover:opacity-90 shadow-md text-[15px]"
          >
            🚀 Continue Mission
          </Link>
          {lastArticle && (
            <Link
              to={lastArticle.url}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full font-extrabold border-2 border-[#F5A623] text-[#1B2F5E] bg-[#FFF8ED]/95 backdrop-blur-sm text-[15px] hover:bg-[#FFF8ED]"
            >
              📖 Resume: {lastArticle.title.length > 24 ? `${lastArticle.title.slice(0, 24)}…` : lastArticle.title}
            </Link>
          )}
        </div>
      </div>
    </DiscovererHeroShell>
  )
}
