import { FAITH_CARDS } from '@/lib/discoverer'

export default function RootedInFaithSection() {
  return (
    <section className="bg-[#FDF9F0] py-12 md:py-16">
      <div className="max-w-[1280px] mx-auto px-5 md:px-8">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-[#1B2F5E] text-center mb-2">
          Rooted in <span className="text-[#148281]">Faith</span>. Awake to the World.
        </h2>
        <p className="text-center text-[#6B7280] text-sm mb-10 max-w-xl mx-auto">
          Every story connects curiosity with character and purpose.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FAITH_CARDS.map((card) => (
            <div
              key={card.title}
              className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(27,47,94,0.06)] border border-white p-5 text-center hover:shadow-md transition-shadow"
            >
              <div
                className={`w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-4xl`}
                aria-hidden
              >
                {card.icon}
              </div>
              <h3 className="font-bold text-[#1B2F5E] mb-2 text-sm md:text-base">{card.title}</h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">{card.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
