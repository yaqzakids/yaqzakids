import DailyQuranReflectionCard from '@/components/islamic/DailyQuranReflectionCard'
import SunnahOfTheDayCard from '@/components/islamic/SunnahOfTheDayCard'
import type { DailyDuaEntry } from '@/lib/parent/dailyDuaContent'
import type { SunnahOfTheDayEntry } from '@/lib/islamic/dailyReminders'

export interface DailyFaithPracticeSectionProps {
  childId?: string | null
  date?: Date
  quranEntry?: DailyDuaEntry
  sunnahEntry?: SunnahOfTheDayEntry
  showFamilyBanner?: boolean
  showMarkComplete?: boolean
  className?: string
}

function FamilyFaithBanner() {
  return (
    <div className="mt-4 rounded-2xl border border-[#D6E4FF] bg-white px-4 py-4 md:px-6 md:py-5 flex flex-col sm:flex-row items-center gap-4 shadow-sm">
      <div className="w-12 h-12 shrink-0 rounded-full bg-[#EEF4FF] flex items-center justify-center text-2xl" aria-hidden>
        👨‍👩‍👧
      </div>
      <div className="flex-1 text-center sm:text-left">
        <p className="font-display font-bold text-[#1B2F5E] text-base md:text-lg m-0 mb-1">
          Grow Together as a Family
        </p>
        <p className="text-sm text-[#6B7280] m-0">
          Little by little, our faith and good deeds build a beautiful future.
        </p>
      </div>
      <div className="text-4xl shrink-0" aria-hidden>
        ✨
      </div>
    </div>
  )
}

export default function DailyFaithPracticeSection({
  childId,
  date = new Date(),
  quranEntry,
  sunnahEntry,
  showFamilyBanner = true,
  showMarkComplete = true,
  className = '',
}: DailyFaithPracticeSectionProps) {
  return (
    <section className={className} aria-label="Daily faith practice">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 items-stretch">
        <DailyQuranReflectionCard entry={quranEntry} date={date} />
        <SunnahOfTheDayCard
          entry={sunnahEntry}
          date={date}
          childId={childId}
          showMarkComplete={showMarkComplete}
        />
      </div>
      {showFamilyBanner && <FamilyFaithBanner />}
    </section>
  )
}
