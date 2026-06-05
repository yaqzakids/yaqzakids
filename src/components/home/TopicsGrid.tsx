import { DISCOVERER_TOPICS } from '../../lib/constants'

export default function TopicsGrid() {
  return (
    <section className="bg-bg py-12 px-6 md:px-10">
      <p className="text-xs font-extrabold tracking-[2px] uppercase text-teal text-center mb-2">WHAT WE COVER</p>
      <h2 className="font-display text-3xl md:text-4xl font-bold text-navy text-center mb-10">13 Topics. One World.</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {DISCOVERER_TOPICS.map((topic) => (
          <div
            key={topic.name}
            className="bg-white rounded-2xl p-5 border-l-4 hover:shadow-md transition-shadow"
            style={{ borderLeftColor: topic.border }}
          >
            <span className="text-2xl mb-2 block">{topic.icon}</span>
            <h3 className="font-bold text-navy text-base mb-1">{topic.name}</h3>
            <p className="text-sm text-muted mb-3">{topic.desc}</p>
            <a href="#" className="text-teal text-sm font-bold hover:opacity-80">Explore →</a>
          </div>
        ))}
      </div>
    </section>
  )
}
