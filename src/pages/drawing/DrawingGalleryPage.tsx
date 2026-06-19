import { Link } from 'react-router-dom'
import PublicLayout from '@/components/layout/PublicLayout'
import PageSeo from '@/components/seo/PageSeo'
import { badgeColor, DRAWING_TUTORIALS } from '@/lib/drawing/references'

export default function DrawingGalleryPage() {
  return (
    <PublicLayout bg="bg-[#EEF4FF]">
      <PageSeo
        title="Drawing Studio"
        description="Follow step-by-step guides and learn to draw!"
        path="/drawing"
      />
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-14">
        <header className="mb-10 text-center max-w-3xl mx-auto">
          <h1
            className="font-display font-bold text-[#1B2F5E] leading-tight mb-4"
            style={{ fontSize: '40px' }}
          >
            Drawing Studio
          </h1>
          <p className="text-lg text-[#1B2F5E]/75 font-semibold">
            Follow the steps, draw on your canvas, and create something beautiful!
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 pb-8">
          {DRAWING_TUTORIALS.map((item) => (
            <article
              key={item.id}
              className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow"
            >
              <div className="relative bg-white flex items-center justify-center p-2 border-b border-[#EEF4FF] aspect-[4/3]">
                <img
                  src={item.coverImagePath}
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
                <h2 className="font-display text-lg font-bold text-[#1B2F5E] mb-1">{item.title}</h2>
                <p className="text-sm text-[#6B7280] mb-4">{item.subtitle}</p>
                <Link
                  to={`/drawing/${item.id}`}
                  className="mt-auto inline-flex justify-center px-6 py-2.5 bg-[#2AAFA0] text-white rounded-full text-sm font-extrabold hover:opacity-90"
                >
                  Start Drawing
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </PublicLayout>
  )
}
