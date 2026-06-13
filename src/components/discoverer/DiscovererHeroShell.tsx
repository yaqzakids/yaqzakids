import type { ReactNode } from 'react'

export const DISCOVERER_HERO_IMAGE =
  'https://i.ibb.co/pjFS3JM6/Chat-GPT-Image-Jun-3-2026-04-45-19-PM.png'

export default function DiscovererHeroShell({ children }: { children: ReactNode }) {
  return (
    <section className="relative min-h-[520px] md:min-h-[600px] overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${DISCOVERER_HERO_IMAGE})` }}
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-[#EEF4FF]/97 via-[#EEF4FF]/82 to-[#EEF4FF]/25 md:to-transparent"
        aria-hidden
      />
      <div className="relative z-10 max-w-[1280px] mx-auto px-5 md:px-8 pt-8 pb-12 md:pt-12 md:pb-16 flex flex-col justify-center min-h-[520px] md:min-h-[600px]">
        {children}
      </div>
    </section>
  )
}
