interface TealProgressBarProps {
  value: number
  max?: number
  showLabel?: boolean
  className?: string
}

export default function TealProgressBar({
  value,
  max = 100,
  showLabel = false,
  className = '',
}: TealProgressBarProps) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between text-xs font-bold text-muted mb-1">
          <span>Progress</span>
          <span className="text-teal">{pct}%</span>
        </div>
      )}
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-teal rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
