import { Link } from 'react-router-dom'
import { SIGNED_OUT_SAMPLE_STORIES } from '@/lib/discovererHomeContent'

export function CuriosityStartsHereSection() {
  return (
    <section id="curiosity-starts-here" className="mb-10 scroll-mt-24">
      <div className="flex items-center justify-between gap-4 mb-2">
        <h2 className="font-display text-xl md:text-2xl font-bold text-[#1B2F5E]">
          🧠 Curiosity Starts Here
        </h2>
        <Link to="/sample-stories" className="text-[#2AAFA0] text-sm font-extrabold shrink-0">
          View all →
        </Link>
      </div>
      <p className="text-sm text-[#6B7280] mb-5 max-w-2xl">
        Sample stories to taste the adventure — then follow a Learning Path for guided progression.
      </p>
      <div className="grid sm:grid-cols-3 gap-5">
        {SIGNED_OUT_SAMPLE_STORIES.map((story) => (
          <div
            key={story.title}
            className="bg-white rounded-2xl shadow-sm overflow-hidden border border-white hover:shadow-md transition-shadow flex flex-col"
          >
            <img src={story.image} alt="" className="w-full h-40 object-cover" />
            <div className="p-5 flex flex-col flex-1">
              <p className="text-[10px] font-extrabold text-[#2AAFA0] uppercase mb-1">{story.category}</p>
              <h3 className="font-bold text-[#1B2F5E] text-sm line-clamp-2 mb-2">{story.title}</h3>
              <p className="text-sm text-[#6B7280] leading-relaxed mb-3 flex-1">{story.description}</p>
              <span className="inline-block text-[10px] font-bold text-[#1B2F5E]/60 bg-[#EEF4FF] rounded-full px-2.5 py-1 mb-4 w-fit">
                {story.ageTag}
              </span>
              <Link
                to={story.url}
                className="inline-flex justify-center px-4 py-2.5 bg-[#2AAFA0] text-white rounded-full text-sm font-extrabold hover:opacity-90"
              >
                Read Story →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

const HOW_IT_WORKS = [
  {
    step: '1',
    icon: '🗺️',
    title: 'Choose a Learning Path',
    text: 'Seven guided journeys — faith, science, history, and more — structured for ages 9–12.',
  },
  {
    step: '2',
    icon: '📖',
    title: 'Read, Quiz & Reflect',
    text: 'Each lesson builds knowledge with stories, quizzes, and reflection questions rooted in faith.',
  },
  {
    step: '3',
    icon: '⭐',
    title: 'Earn Stars & Level Up',
    text: 'Progress unlocks badges, certificates, and the next lesson in your path.',
  },
] as const

export function HowYaqzaWorksSection() {
  return (
    <section className="mb-10">
      <h2 className="font-display text-2xl font-bold text-[#1B2F5E] mb-2 text-center">How Yaqza Works</h2>
      <p className="text-center text-[#6B7280] text-sm mb-8 max-w-xl mx-auto">
        A guided learning journey — not endless browsing.
      </p>
      <div className="grid sm:grid-cols-3 gap-5">
        {HOW_IT_WORKS.map((item) => (
          <div key={item.step} className="bg-white rounded-2xl shadow-sm p-6 border border-[#EEF4FF] text-center">
            <p className="text-3xl mb-3" aria-hidden>
              {item.icon}
            </p>
            <p className="text-[#2AAFA0] text-xs font-extrabold mb-2">Step {item.step}</p>
            <h3 className="font-bold text-[#1B2F5E] mb-2">{item.title}</h3>
            <p className="text-sm text-[#6B7280] leading-relaxed">{item.text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export function ForParentsSection() {
  return (
    <section className="mb-10 bg-white rounded-2xl shadow-sm p-8 md:p-10 border border-[#EEF4FF]">
      <p className="text-[#2AAFA0] text-xs font-extrabold tracking-widest uppercase mb-2">For Parents</p>
      <h2 className="font-display text-2xl font-bold text-[#1B2F5E] mb-3">
        Safe, meaningful learning for your child
      </h2>
      <p className="text-[#6B7280] max-w-2xl mb-6 leading-relaxed">
        Track progress, manage child profiles, and explore a curriculum rooted in Islamic values —
        without ads or distractions.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          to="/parents"
          className="inline-flex px-6 py-3 bg-[#1B2F5E] text-white rounded-full font-extrabold text-sm"
        >
          Learn more for parents →
        </Link>
        <Link
          to="/signup"
          className="inline-flex px-6 py-3 border-2 border-[#2AAFA0] text-[#2AAFA0] rounded-full font-extrabold text-sm"
        >
          Start free →
        </Link>
      </div>
    </section>
  )
}

export function PricingTeaserSection() {
  return (
    <section className="mb-10">
      <div className="bg-gradient-to-br from-[#1B2F5E] to-[#2AAFA0] rounded-2xl p-8 md:p-10 text-white shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <p className="text-white/80 text-xs font-extrabold tracking-widest uppercase mb-2">Pricing</p>
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">Start free. Grow with your family.</h2>
          <p className="text-white/85 max-w-md text-sm leading-relaxed">
            Free sample paths and stories. Upgrade when you&apos;re ready for the full guided journey.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 shrink-0">
          <Link
            to="/pricing"
            className="inline-flex px-6 py-3 bg-white text-[#1B2F5E] rounded-full font-extrabold text-sm hover:opacity-90"
          >
            View Pricing →
          </Link>
          <Link
            to="/signup"
            className="inline-flex px-6 py-3 bg-[#F5A623] text-[#1B2F5E] rounded-full font-extrabold text-sm hover:opacity-90"
          >
            ✨ Create Free Account
          </Link>
        </div>
      </div>
    </section>
  )
}
