import {
  DUA_ROTATION,
  getDailyDuaForDate,
  getReminderHeading,
  getReminderScheduleLabel,
  type DailyDuaEntry,
} from '@/lib/parent/dailyDuaContent'

export default function DailyDuaCard({
  entry,
  compact = false,
  date = new Date(),
}: {
  entry?: DailyDuaEntry
  compact?: boolean
  date?: Date
}) {
  const dua = entry ?? getDailyDuaForDate(date, DUA_ROTATION)
  const heading = getReminderHeading(date, DUA_ROTATION)
  const scheduleLabel = getReminderScheduleLabel(date, DUA_ROTATION)

  return (
    <div className="bg-white rounded-2xl border border-[#E2EBF8] shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-[#1B2F5E] to-[#243B6E] px-5 py-4">
        <p className="text-[#2AAFA0] text-xs font-extrabold tracking-widest uppercase mb-1">
          Daily Du&apos;a & Quran Reflection
        </p>
        <h3 className="font-display text-lg font-bold text-white">{heading}</h3>
        <p className="text-white/70 text-xs mt-1 mb-0">{scheduleLabel}</p>
      </div>

      <div className={`p-5 md:p-6 space-y-5 ${compact ? 'space-y-4' : ''}`}>
        <div>
          <p className="text-right text-2xl md:text-3xl font-bold text-[#1B2F5E] leading-relaxed mb-2" dir="rtl">
            {dua.arabic}
          </p>
          <p className="text-sm text-[#6B7280] italic mb-1">{dua.transliteration}</p>
          <p className="text-[#1B2F5E] font-semibold">{dua.translationEn}</p>
          <p className="text-xs text-[#2AAFA0] font-bold mt-2">{dua.source}</p>
        </div>

        {!compact && (
          <div className="rounded-xl bg-[#EEF4FF] border border-[#E2EBF8] p-4">
            <p className="text-[10px] font-extrabold text-[#2AAFA0] uppercase tracking-wide mb-2">
              Reflection
            </p>
            <p className="text-sm text-[#1B2F5E]/90 leading-relaxed">{dua.reflection}</p>
          </div>
        )}

        {dua.quranVerse && !compact && (
          <div className="rounded-xl bg-[#F0FDF9] border border-[#2AAFA0]/20 p-4">
            <p className="text-[10px] font-extrabold text-[#2AAFA0] uppercase tracking-wide mb-2">
              Quran Verse
            </p>
            <p className="text-right text-lg font-bold text-[#1B2F5E] mb-2" dir="rtl">
              {dua.quranVerse.arabic}
            </p>
            <p className="text-sm text-[#1B2F5E]/80">{dua.quranVerse.translation}</p>
            <p className="text-xs text-[#6B7280] mt-1">{dua.quranVerse.reference}</p>
          </div>
        )}

        <div className="rounded-xl bg-[#FFF8ED] border border-[#F5A623]/20 p-4">
          <p className="text-[10px] font-extrabold text-[#D4820A] uppercase tracking-wide mb-2">
            Family Discussion
          </p>
          <p className="text-sm text-[#1B2F5E] leading-relaxed">{dua.discussionQuestion}</p>
        </div>
      </div>
    </div>
  )
}
