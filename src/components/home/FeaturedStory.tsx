import { Link } from 'react-router-dom'

export default function FeaturedStory() {
  return (
    <section className="relative w-full">
      <img
        src="https://i.ibb.co/Z12Kh7qv/Chat-GPT-Image-Jun-4-2026-05-37-16-PM.png"
        alt=""
        className="block w-full h-auto"
      />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.5) 40%, transparent 100%)' }}
      />
      <div className="absolute inset-0 z-10 flex items-center px-6 md:px-[60px] py-14">
        <div className="max-w-xl">
          <p className="text-gold text-[13px] font-bold mb-3">⭐ Featured Story</p>
          <h2 className="font-display text-3xl md:text-4xl font-extrabold text-white mb-3.5">
            Why Do Giraffes Have Long Necks?
          </h2>
          <p className="text-white/85 text-base leading-relaxed mb-6">
            Find out how Allah created giraffes with amazing features and why they are so special!
          </p>
          <Link
            to="/signup"
            className="inline-block bg-teal text-white px-7 py-3 rounded-full text-[15px] font-bold hover:opacity-90 transition-opacity"
          >
            Read Story
          </Link>
        </div>
      </div>
    </section>
  )
}
