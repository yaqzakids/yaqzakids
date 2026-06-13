interface BadgeHexagonProps {
  icon: string
  name: string
  color?: string
  earned?: boolean
  subtitle?: string
  size?: 'sm' | 'md'
}

export default function BadgeHexagon({
  icon,
  name,
  color = '#2AAFA0',
  earned = true,
  subtitle,
  size = 'md',
}: BadgeHexagonProps) {
  const dim = size === 'sm' ? 72 : 96
  const fill = earned ? color : '#D1D5DB'

  return (
    <div className="flex flex-col items-center shrink-0" style={{ width: dim + 16 }}>
      <svg width={dim} height={dim * 0.92} viewBox="0 0 100 92" aria-hidden>
        <polygon
          points="50,2 95,26 95,66 50,90 5,66 5,26"
          fill={fill}
          opacity={earned ? 1 : 0.45}
        />
        <text
          x="50"
          y="54"
          textAnchor="middle"
          fontSize="28"
          dominantBaseline="middle"
        >
          {icon}
        </text>
      </svg>
      <p className="text-xs font-bold text-navy text-center mt-2 leading-tight">{name}</p>
      {subtitle && (
        <p className="text-[10px] text-muted text-center mt-0.5">{subtitle}</p>
      )}
    </div>
  )
}
