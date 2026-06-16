import { Link } from 'react-router-dom'
import type { DiscovererFeaturedStory } from '@/lib/discovererHomeContent'

export default function FeaturedStorySection({
  story,
  signedIn = false,
  ageLabel,
}: {
  story: DiscovererFeaturedStory
  signedIn?: boolean
  ageLabel?: string
}) {
  return (
    <section className="mb-10">
      <p className="text-[#2AAFA0] text-xs font-extrabold tracking-widest uppercase mb-1">
        {signedIn ? "Editor's Pick" : 'Featured Story'}
      </p>
      <h2 className="font-display text-lg font-bold text-[#1B2F5E]/80 mb-4">
        {signedIn ? "Today's Featured Story" : 'A story worth reading'}
      </h2>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden grid md:grid-cols-2 border border-[#E2EBF8]">
        <img src={story.image} alt="" className="w-full h-full min-h-[220px] object-cover" />
        <div className="p-6 md:p-8 flex flex-col justify-center">
          <span className="text-[#2AAFA0] text-xs font-extrabold uppercase mb-2">{story.category}</span>
          <h3 className="font-display text-xl md:text-2xl font-bold text-[#1B2F5E] mb-3">{story.title}</h3>
          <p className="text-[#6B7280] leading-relaxed mb-4 text-sm">{story.description}</p>
          <p className="text-xs text-[#6B7280] mb-5">
            {story.readingTime} min read · {ageLabel ? `Ages ${ageLabel}` : story.ageTag}
          </p>
          <Link
            to={story.url}
            className="inline-flex self-start px-5 py-2.5 border-2 border-[#2AAFA0] text-[#2AAFA0] rounded-full font-extrabold text-sm hover:bg-[#2AAFA0]/5"
          >
            {story.ctaLabel}
          </Link>
        </div>
      </div>
    </section>
  )
}
