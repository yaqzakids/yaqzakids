import { useEffect, useState } from 'react'
import { getSunnahForDate, type SunnahOfTheDayEntry } from '@/lib/islamic/dailyReminders'
import {
  isSunnahCompleted,
  markSunnahCompleted,
} from '@/lib/islamic/sunnahCompletionStorage'

export default function SunnahOfTheDayCard({
  entry,
  date = new Date(),
  childId,
  showMarkComplete = true,
}: {
  entry?: SunnahOfTheDayEntry
  date?: Date
  childId?: string | null
  showMarkComplete?: boolean
}) {
  const sunnah = entry ?? getSunnahForDate(date)
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    if (!childId) {
      setCompleted(false)
      return
    }
    setCompleted(isSunnahCompleted(childId, sunnah.id))
  }, [childId, sunnah.id])

  const handleComplete = () => {
    if (!childId || completed) return
    markSunnahCompleted(childId, sunnah.id)
    setCompleted(true)
    // TODO: Award reward_points via Supabase when child rewards API is available.
  }

  return (
    <article className="flex flex-col h-full bg-[#FFF8ED] rounded-2xl shadow-[0_8px_30px_rgba(27,47,94,0.08)] border border-[#F5E6C8] overflow-hidden">
      <header className="bg-[#1B2F5E] px-4 py-3.5 flex items-center gap-3">
        <div
          className="w-11 h-11 shrink-0 rounded-full bg-[#F5A623]/20 border-2 border-[#F5A623] flex items-center justify-center text-xl"
          aria-hidden
        >
          🕌
        </div>
        <p className="text-white text-sm font-extrabold tracking-[0.12em] uppercase m-0">
          Sunnah of the Day
        </p>
      </header>

      <div className="flex flex-col flex-1 p-4 md:p-5 gap-3">
        <div className="text-center">
          <div
            className="w-16 h-16 mx-auto rounded-full bg-[#FFE9A8] flex items-center justify-center text-4xl mb-2 shadow-inner"
            aria-hidden
          >
            {sunnah.emoji}
          </div>
          <h3 className="font-display text-xl font-bold text-[#1B2F5E] m-0">{sunnah.title}</h3>
        </div>

        <div className="rounded-xl border-2 border-[#F5A623]/50 bg-white/70 px-4 py-3 text-center relative">
          <span className="absolute left-3 top-1 text-3xl text-[#F5A623]/50 font-serif leading-none" aria-hidden>
            “
          </span>
          <p className="text-sm md:text-base font-semibold text-[#1B2F5E] leading-relaxed px-4 m-0">
            {sunnah.hadith}
          </p>
          <p className="text-xs text-[#D4820A] font-bold mt-2 mb-0">— {sunnah.reference}</p>
        </div>

        <div className="flex items-start gap-2 px-1">
          <span className="text-[#F5A623] text-lg shrink-0" aria-hidden>
            ⭐
          </span>
          <div>
            <p className="text-[10px] font-extrabold text-[#D4820A] uppercase tracking-wide mb-0.5">
              Try it today!
            </p>
            <p className="text-xs md:text-sm text-[#1B2F5E] m-0">{sunnah.actionText}</p>
          </div>
        </div>

        <div className="rounded-xl bg-[#FFF3D6] border border-[#F5D78E]/50 px-4 py-3 flex items-center justify-between gap-3 mt-auto">
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden>
              ⭐
            </span>
            <p className="font-extrabold text-[#1B2F5E] text-sm m-0">+{sunnah.rewardPoints} Bonus Stars</p>
          </div>
          <span className="text-2xl" aria-hidden>
            🎁
          </span>
        </div>

        {showMarkComplete && childId && (
          <button
            type="button"
            onClick={handleComplete}
            disabled={completed}
            className={`w-full py-2.5 rounded-full text-sm font-extrabold border-0 cursor-pointer transition-opacity ${
              completed
                ? 'bg-[#2AAFA0]/15 text-[#2AAFA0] cursor-default'
                : 'bg-[#F5A623] text-white hover:opacity-90'
            }`}
          >
            {completed ? 'Completed ✓' : 'Mark Complete'}
          </button>
        )}
      </div>
    </article>
  )
}
