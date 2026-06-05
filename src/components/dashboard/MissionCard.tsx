interface MissionCardProps {
  title: string
  xpReward: number
  date: string
  onStart?: () => void
}

export default function MissionCard({ title, xpReward, date, onStart }: MissionCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-200 flex items-center justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-xs text-teal font-bold uppercase mb-1">Today's Mission</p>
        <h3 className="font-bold text-navy text-sm">{title}</h3>
        <p className="text-xs text-muted mt-1">{date}</p>
      </div>
      <div className="text-right">
        <p className="text-gold font-extrabold text-sm mb-2">+{xpReward} XP</p>
        <button
          onClick={onStart}
          className="bg-gold text-white px-4 py-1.5 rounded-full text-xs font-bold hover:opacity-90 transition-opacity"
        >
          Start
        </button>
      </div>
    </div>
  )
}
