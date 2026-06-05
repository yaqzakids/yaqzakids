import { EXPLORER_CATEGORIES } from '../../lib/constants'

export default function CategoryStrip() {
  return (
    <section className="bg-white w-full flex flex-wrap md:flex-nowrap overflow-x-auto">
      {EXPLORER_CATEGORIES.map((cat) => (
        <div
          key={cat.name}
          className="flex-1 min-w-[120px] flex flex-col items-center py-5 px-2 cursor-pointer transition-transform hover:scale-105"
          style={{ backgroundColor: cat.bg }}
        >
          <img src={cat.image} alt={cat.name} className="w-[100px] h-[100px] object-cover rounded-[14px] mb-2.5" />
          <span className="text-[11px] font-bold text-navy text-center leading-tight">{cat.name}</span>
        </div>
      ))}
    </section>
  )
}
