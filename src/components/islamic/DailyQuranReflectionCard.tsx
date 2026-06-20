import {
  getQuranReflectionForDate,
  getQuranReminderHeading,
  getQuranScheduleLabel,
} from '@/lib/islamic/dailyReminders'
import type { DailyDuaEntry } from '@/lib/parent/dailyDuaContent'

export default function DailyQuranReflectionCard({
  entry,
  date = new Date(),
}: {
  entry?: DailyDuaEntry
  date?: Date
}) {
  const dua = entry ?? getQuranReflectionForDate(date)
  const heading = getQuranReminderHeading(date)
  const scheduleLabel = getQuranScheduleLabel(date)

  return (
    <article className="flex flex-col h-full bg-white rounded-2xl shadow-[0_8px_30px_rgba(27,47,94,0.08)] border border-[#E2EBF8] overflow-hidden">
      <header className="bg-[#1B2F5E] px-4 py-4">
        <div className="flex items-start gap-3">
          <div
            className="w-11 h-11 shrink-0 rounded-full bg-[#2AAFA0]/15 border-2 border-[#2AAFA0] flex items-center justify-center text-xl"
            aria-hidden
          >
            📖
          </div>
          <div className="min-w-0">
            <p className="text-[#2AAFA0] text-[10px] font-extrabold tracking-[0.14em] uppercase mb-0.5">
              Daily Du&apos;a &amp; Quran Reflection
            </p>
            <h3 className="font-display text-lg font-bold text-white leading-tight m-0">{heading}</h3>
            <p className="text-white/65 text-[11px] mt-1 mb-0">{scheduleLabel}</p>
          </div>
        </div>
      </header>

      <div className="flex flex-col flex-1 p-4 md:p-5 gap-3">
        <div>
          <p
            className="text-right text-2xl md:text-[1.65rem] font-bold text-[#1B2F5E] leading-relaxed mb-1.5"
            dir="rtl"
          >
            {dua.arabic}
          </p>
          <p className="text-xs text-[#6B7280] italic mb-1">{dua.transliteration}</p>
          <p className="text-[#1B2F5E] font-bold text-sm md:text-base leading-snug">
            {dua.translationEn}
          </p>
          <p className="text-xs text-[#2AAFA0] font-extrabold mt-1.5 mb-0">{dua.source}</p>
        </div>

        <div className="rounded-xl bg-[#EEF4FF] border border-[#D6E4FF] p-3 flex gap-2.5">
          <span className="text-lg shrink-0" aria-hidden>
            💡
          </span>
          <div>
            <p className="text-[10px] font-extrabold text-[#2AAFA0] uppercase tracking-wide mb-1">
              Reflection
            </p>
            <p className="text-xs md:text-sm text-[#1B2F5E]/90 leading-relaxed m-0">{dua.reflection}</p>
          </div>
        </div>

        <div className="rounded-xl bg-[#FFF8ED] border border-[#F5D78E]/40 p-3 flex gap-2.5 mt-auto">
          <span className="text-lg shrink-0" aria-hidden>
            👨‍👩‍👧
          </span>
          <div>
            <p className="text-[10px] font-extrabold text-[#D4820A] uppercase tracking-wide mb-1">
              Family Discussion
            </p>
            <p className="text-xs md:text-sm text-[#1B2F5E] leading-relaxed m-0">{dua.discussionQuestion}</p>
          </div>
        </div>
      </div>
    </article>
  )
}
