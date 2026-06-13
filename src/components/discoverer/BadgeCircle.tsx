interface BadgeCircleProps {
  icon: string
  name: string
  color?: string
  earned?: boolean
}

/** Circular badge used on the Discoverer homepage (matches mockup). */
export default function BadgeCircle({
  icon,
  name,
  color = '#2AAFA0',
  earned = true,
}: BadgeCircleProps) {
  return (
    <div className="flex flex-col items-center shrink-0 w-[88px]">
      <div
        className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-3xl shadow-sm"
        style={{
          background: earned ? color : '#E5E7EB',
          opacity: earned ? 1 : 0.5,
        }}
      >
        {icon}
      </div>
      <p className="text-[11px] font-bold text-navy text-center mt-2 leading-tight">{name}</p>
    </div>
  )
}
