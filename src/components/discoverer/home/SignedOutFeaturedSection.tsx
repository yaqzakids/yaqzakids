import { Link } from 'react-router-dom'
import {
  SIGNED_OUT_FEATURED_STORY,
  SIGNED_OUT_FEATURED_SIDEBAR,
} from '@/lib/discovererHomeContent'

export default function SignedOutFeaturedSection() {
  const featured = SIGNED_OUT_FEATURED_STORY

  return (
    <section className="bg-[#EEF4FF] py-12 md:py-14">
      <div className="max-w-[1280px] mx-auto px-5 md:px-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h2 className="font-display text-xl md:text-2xl font-bold text-[#1B2F5E]">
            Today&apos;s Featured Story
          </h2>
          <Link to="/sample-stories" className="text-[#148281] text-sm font-extrabold shrink-0">
            View all →
          </Link>
        </div>

        <div className="grid lg:grid-cols-[1fr_280px] gap-5">
          {/* Main featured card */}
          <div className="bg-white rounded-3xl shadow-[0_8px_32px_rgba(27,47,94,0.08)] overflow-hidden flex flex-col md:flex-row">
            <div className="md:w-[45%] shrink-0">
              <img
                src={featured.image}
                alt=""
                className="w-full h-52 md:h-full min-h-[220px] object-cover"
              />
            </div>
            <div className="p-6 md:p-8 flex flex-col justify-center">
              <p className="text-[#148281] text-[11px] font-extrabold tracking-widest uppercase mb-2">
                {featured.category}
              </p>
              <h3 className="font-display text-2xl md:text-3xl font-bold text-[#1B2F5E] mb-3">
                {featured.title}
              </h3>
              <p className="text-[#6B7280] leading-relaxed mb-6 text-[15px]">{featured.description}</p>
              <Link
                to={featured.url}
                className="inline-flex self-start items-center gap-2 px-6 py-3 bg-[#148281] text-white rounded-full font-extrabold text-sm hover:opacity-90 shadow-sm"
              >
                {featured.ctaLabel}
              </Link>
            </div>
          </div>

          {/* Sidebar story cards */}
          <div className="flex flex-col gap-4">
            {SIGNED_OUT_FEATURED_SIDEBAR.map((story) => (
              <Link
                key={story.title}
                to={story.url}
                className="bg-white rounded-2xl shadow-sm overflow-hidden flex hover:shadow-md transition-shadow group border border-white"
              >
                <img
                  src={story.image}
                  alt=""
                  className="w-24 h-24 shrink-0 object-cover group-hover:scale-105 transition-transform"
                />
                <div className="p-3 flex flex-col justify-center min-w-0">
                  <p className="text-[10px] font-extrabold text-[#148281] uppercase tracking-wide mb-0.5">
                    {story.category}
                  </p>
                  <p className="font-bold text-[#1B2F5E] text-sm line-clamp-2 leading-snug">
                    {story.title}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
