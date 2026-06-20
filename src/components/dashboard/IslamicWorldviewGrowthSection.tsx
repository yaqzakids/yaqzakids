import { USUL_THEMES } from '@/lib/parent/dailyDuaContent'

interface IslamicWorldviewGrowthSectionProps {
  className?: string
  titleClassName?: string
}

export default function IslamicWorldviewGrowthSection({
  className = 'mb-10',
  titleClassName = 'font-display text-2xl font-bold text-navy mb-5',
}: IslamicWorldviewGrowthSectionProps) {
  return (
    <section className={className}>
      <h2 className={titleClassName}>Islamic Worldview Growth</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {USUL_THEMES.map((theme) => (
          <div
            key={theme.id}
            className="bg-white rounded-2xl border border-gray-200 p-4 text-center shadow-sm"
          >
            <span className="text-2xl block mb-2" aria-hidden>
              {theme.icon}
            </span>
            <p className="text-sm font-bold text-navy">{theme.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
