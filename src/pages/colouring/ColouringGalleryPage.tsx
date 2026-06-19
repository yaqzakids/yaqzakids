import { Link } from 'react-router-dom'
import PublicLayout from '@/components/layout/PublicLayout'
import PageSeo from '@/components/seo/PageSeo'
import {
  badgeColor,
  COLOURING_ILLUSTRATIONS,
} from '@/lib/colouring/illustrations'

export default function ColouringGalleryPage() {
  return (
    <PublicLayout bg="bg-[#EEF4FF]">
      <PageSeo
        title="Colouring Studio"
        description="Choose an illustration, colour it in, then download or print it!"
        path="/colouring"
      />
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-14">
        <header className="mb-10 text-center max-w-3xl mx-auto">
          <h1
            className="font-display font-bold text-[#1B2F5E] leading-tight mb-4"
            style={{ fontSize: '40px' }}
          >
            Colouring Studio
          </h1>
          <p className="text-lg text-[#1B2F5E]/75 font-semibold">
            Choose an illustration, colour it in, then download or print it!
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 pb-8">
          {COLOURING_ILLUSTRATIONS.map((item) => (
            <article
              key={item.id}
              className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow"
            >
              <div className="relative bg-white flex items-center justify-center p-2 border-b border-[#EEF4FF] aspect-[4/3]">
                <img
                  src={item.imagePath}
                  alt={item.title}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              </div>
              <div className="p-4 flex flex-col flex-1">
                <span
                  className="inline-flex self-start px-3 py-1 rounded-full text-[11px] font-extrabold text-white mb-2"
                  style={{ backgroundColor: badgeColor(item.badge) }}
                >
                  {item.badge}
                </span>
                <h2 className="font-display text-lg font-bold text-[#1B2F5E] mb-4 line-clamp-2">
                  {item.title}
                </h2>
                <Link
                  to={`/colouring/${item.id}`}
                  className="mt-auto inline-flex justify-center px-6 py-2.5 bg-[#F5A623] text-white rounded-full text-sm font-extrabold hover:opacity-90"
                >
                  Start Colouring
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </PublicLayout>
  )
}
