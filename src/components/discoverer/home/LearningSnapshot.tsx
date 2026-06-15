export interface LearningSnapshotProps {
  levelName: string
  levelNumber: number
  xp: number
  xpToNext: number
  stars: number
  streak: number
  articlesCompleted: number
  badgesEarned: number
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="bg-white rounded-xl border border-[#E2EBF8] p-4 text-center shadow-sm">
      <p className={`text-xl md:text-2xl font-extrabold mb-1 ${accent ?? 'text-[#1B2F5E]'}`}>{value}</p>
      <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wide">{label}</p>
    </div>
  )
}

export default function LearningSnapshot({
  levelName,
  levelNumber,
  xp,
  xpToNext,
  stars,
  streak,
  articlesCompleted,
  badgesEarned,
}: LearningSnapshotProps) {
  return (
    <section className="mb-8" aria-labelledby="learning-snapshot-heading">
      <h2 id="learning-snapshot-heading" className="sr-only">
        Learning Snapshot
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Current Level" value={`L${levelNumber} ${levelName}`} />
        <StatCard
          label="XP Progress"
          value={xpToNext > 0 ? `${xp} (+${xpToNext})` : `${xp}`}
          accent="text-[#2AAFA0]"
        />
        <StatCard label="Stars Earned" value={stars.toLocaleString()} accent="text-[#F5A623]" />
        <StatCard label="Day Streak" value={`${streak} 🔥`} accent="text-[#D4820A]" />
        <StatCard label="Articles Done" value={String(articlesCompleted)} />
        <StatCard label="Badges Earned" value={String(badgesEarned)} accent="text-[#8B6BB1]" />
      </div>
    </section>
  )
}
