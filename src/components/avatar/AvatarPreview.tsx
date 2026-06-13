import { useId } from 'react'
import type { AvatarConfig, BackgroundId, HeadwearId } from '@/lib/avatarOptions'
import { getHeadwearOption, lightenColor, shadeColor } from '@/lib/avatarOptions'

interface AvatarPreviewProps {
  config: AvatarConfig
  size?: number
  className?: string
}

const SKIN = '#E8B896'
const SKIN_SHADOW = '#D4A07A'
const SKIN_HIGHLIGHT = '#F5D4B8'
const CHEEK = '#F4A89A'
const IRIS = '#3D2914'
const SHIRT = '#FAFAFA'
const HAIR_DEFAULT = '#4A3228'

function BackgroundLayer({ id, style }: { id: string; style: BackgroundId }) {
  switch (style) {
    case 'nature':
      return (
        <>
          <defs>
            <linearGradient id={`${id}-bg-nature`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#B8E6F5" />
              <stop offset="55%" stopColor="#D4F0D4" />
              <stop offset="100%" stopColor="#8FD4A0" />
            </linearGradient>
          </defs>
          <rect width="200" height="200" fill={`url(#${id}-bg-nature)`} />
          <ellipse cx="100" cy="178" rx="90" ry="22" fill="#6BBF7A" opacity="0.45" />
          <path d="M 0 130 Q 60 110 120 125 T 200 120 L 200 200 L 0 200 Z" fill="#5AAE6A" opacity="0.35" />
          <ellipse cx="40" cy="150" rx="28" ry="12" fill="#4A9E5A" opacity="0.3" />
          <circle cx="165" cy="55" r="18" fill="#FFE082" opacity="0.85" />
        </>
      )
    case 'library':
      return (
        <>
          <rect width="200" height="200" fill="#F5EDE0" />
          <rect x="0" y="0" width="200" height="200" fill="#8B6914" opacity="0.08" />
          {[20, 50, 80, 110, 140, 170].map((x) => (
            <rect key={x} x={x} y={20} width="8" height="60" rx="2" fill="#C4A574" opacity="0.35" />
          ))}
          {[25, 55, 85, 115, 145].map((x) => (
            <rect key={`b-${x}`} x={x} y={150} width="12" height="28" rx="2" fill="#2AAFA0" opacity="0.25" />
          ))}
          <rect x="0" y="165" width="200" height="35" fill="#D4C4A8" opacity="0.5" />
        </>
      )
    case 'geometric':
      return (
        <>
          <rect width="200" height="200" fill="#F0EBE3" />
          <defs>
            <pattern id={`${id}-geo`} width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="14" fill="none" stroke="#C9A227" strokeWidth="1.5" opacity="0.35" />
              <circle cx="20" cy="20" r="6" fill="#2AAFA0" opacity="0.15" />
            </pattern>
          </defs>
          <rect width="200" height="200" fill={`url(#${id}-geo)`} />
        </>
      )
    case 'stars':
    default:
      return (
        <>
          <defs>
            <linearGradient id={`${id}-bg-stars`} x1="0.2" y1="0" x2="0.8" y2="1">
              <stop offset="0%" stopColor="#1E3A5F" />
              <stop offset="100%" stopColor="#2C5282" />
            </linearGradient>
          </defs>
          <rect width="200" height="200" fill={`url(#${id}-bg-stars)`} />
          <ellipse cx="50" cy="170" rx="55" ry="18" fill="#fff" opacity="0.12" />
          <ellipse cx="160" cy="175" rx="45" ry="14" fill="#fff" opacity="0.1" />
          {[
            [35, 45, 2.5],
            [90, 30, 2],
            [155, 50, 2.5],
            [120, 75, 1.5],
            [45, 90, 1.5],
            [170, 95, 2],
          ].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill="#FFD966" opacity={0.85} />
          ))}
        </>
      )
  }
}

function Body({ base }: { base: AvatarConfig['base'] }) {
  if (base === 'boy') {
    return (
      <>
        <ellipse cx="100" cy="178" rx="54" ry="30" fill={shadeColor(SHIRT, 0.08)} />
        <path
          d="M 56 128 Q 100 148 144 128 L 152 200 L 48 200 Z"
          fill={SHIRT}
          stroke={shadeColor(SHIRT, 0.12)}
          strokeWidth="1"
        />
        <path d="M 78 128 L 100 145 L 122 128" fill="none" stroke="#E8E8E8" strokeWidth="2.5" strokeLinejoin="round" />
        <ellipse cx="100" cy="138" rx="20" ry="5" fill="#fff" opacity="0.6" />
      </>
    )
  }
  return (
    <>
      <ellipse cx="100" cy="178" rx="50" ry="28" fill={shadeColor(SHIRT, 0.08)} />
      <path
        d="M 60 128 Q 100 150 140 128 L 146 200 L 54 200 Z"
        fill={SHIRT}
        stroke={shadeColor(SHIRT, 0.12)}
        strokeWidth="1"
      />
      <path d="M 82 128 L 100 146 L 118 128" fill="none" stroke="#E8E8E8" strokeWidth="2.5" strokeLinejoin="round" />
      <ellipse cx="100" cy="138" rx="18" ry="5" fill="#fff" opacity="0.6" />
    </>
  )
}

function Neck() {
  return <rect x="88" y="112" width="24" height="20" rx="8" fill={SKIN_SHADOW} />
}

function Face({ id }: { id: string }) {
  return (
    <>
      <ellipse cx="100" cy="88" rx="38" ry="40" fill={SKIN_SHADOW} />
      <ellipse cx="100" cy="86" rx="36" ry="38" fill={`url(#${id}-skin)`} />
      <ellipse cx="86" cy="76" rx="12" ry="8" fill={SKIN_HIGHLIGHT} opacity="0.55" />
      <ellipse cx="74" cy="98" rx="9" ry="5.5" fill={CHEEK} opacity="0.4" />
      <ellipse cx="126" cy="98" rx="9" ry="5.5" fill={CHEEK} opacity="0.4" />
    </>
  )
}

function Eyes() {
  const left = { cx: 84, cy: 84 }
  const right = { cx: 116, cy: 84 }
  return (
    <>
      <ellipse cx={left.cx} cy={left.cy} rx="10" ry="11" fill="#fff" />
      <ellipse cx={right.cx} cy={right.cy} rx="10" ry="11" fill="#fff" />
      <circle cx={left.cx} cy={left.cy + 1} r="5.5" fill={IRIS} />
      <circle cx={right.cx} cy={right.cy + 1} r="5.5" fill={IRIS} />
      <circle cx={left.cx + 2} cy={left.cy - 2} r="2" fill="#fff" />
      <circle cx={right.cx + 2} cy={right.cy - 2} r="2" fill="#fff" />
    </>
  )
}

function NoseAndMouth() {
  return (
    <>
      <circle cx="100" cy="96" r="1.5" fill={shadeColor(SKIN, 0.25)} opacity="0.6" />
      <path d="M 88 104 Q 100 112 112 104" fill="none" stroke="#C97B7B" strokeWidth="2.2" strokeLinecap="round" />
    </>
  )
}

function HairBack({ headwear, color }: { headwear: HeadwearId; color: string }) {
  if (headwear.startsWith('hijab') || headwear.startsWith('kufi')) return null

  if (headwear === 'hair-girl-long') {
    return (
      <>
        <path d="M 58 80 C 52 50 148 50 142 80 C 148 110 140 140 100 148 C 60 140 52 110 58 80 Z" fill={color} />
        <path d="M 62 100 Q 58 130 64 155 Q 72 140 68 105 Z" fill={shadeColor(color, 0.1)} />
        <path d="M 138 100 Q 142 130 136 155 Q 128 140 132 105 Z" fill={shadeColor(color, 0.1)} />
      </>
    )
  }

  if (headwear === 'hair-girl-bob') {
    return <path d="M 56 82 C 54 48 146 48 144 82 C 150 108 138 128 100 132 C 62 128 50 108 56 82 Z" fill={color} />
  }

  if (headwear === 'hair-boy-curly') {
    return (
      <>
        <ellipse cx="100" cy="52" rx="44" ry="26" fill={color} />
        <ellipse cx="68" cy="58" rx="16" ry="18" fill={lightenColor(color, 0.08)} />
        <ellipse cx="132" cy="58" rx="16" ry="18" fill={lightenColor(color, 0.08)} />
      </>
    )
  }

  return <path d="M 58 78 C 58 48 142 48 142 78 C 146 92 138 102 100 106 C 62 102 54 92 58 78 Z" fill={color} />
}

function HeadwearFront({ headwear, color, id }: { headwear: HeadwearId; color: string; id: string }) {
  if (headwear.startsWith('hijab')) {
    const shadow = shadeColor(color, 0.14)
    const highlight = lightenColor(color, 0.12)
    return (
      <>
        <path d="M 48 90 C 44 52 156 52 152 90 C 158 118 152 148 100 158 C 48 148 42 118 48 90 Z" fill={shadow} />
        <path d="M 52 88 C 50 54 150 54 148 88 C 152 114 148 142 100 152 C 52 142 48 114 52 88 Z" fill={`url(#${id}-hijab)`} />
        <path d="M 68 92 Q 100 82 132 92" stroke={highlight} strokeWidth="2.5" fill="none" opacity="0.45" strokeLinecap="round" />
        {headwear === 'hijab-teal' && (
          <>
            <circle cx="68" cy="108" r="3" fill="#F5A623" />
            <circle cx="132" cy="108" r="3" fill="#F5A623" />
          </>
        )}
      </>
    )
  }

  if (headwear.startsWith('kufi')) {
    return (
      <>
        <ellipse cx="100" cy="50" rx="40" ry="14" fill={color} stroke={shadeColor(color, 0.18)} strokeWidth="1" />
        <ellipse cx="100" cy="46" rx="34" ry="10" fill={lightenColor(color, 0.08)} />
      </>
    )
  }

  if (headwear === 'hair-girl-bob') {
    return (
      <>
        <path d="M 58 72 Q 100 58 142 72 Q 138 62 100 54 Q 62 62 58 72" fill={lightenColor(color, 0.1)} />
        <path d="M 54 88 Q 48 108 56 124 Q 64 112 60 92 Z" fill={color} />
        <path d="M 146 88 Q 152 108 144 124 Q 136 112 140 92 Z" fill={color} />
      </>
    )
  }

  return <path d="M 64 70 Q 100 54 136 70 Q 130 60 100 52 Q 70 60 64 70" fill={lightenColor(color, 0.1)} />
}

function AccessoryLayer({ accessory }: { accessory: AvatarConfig['accessory'] }) {
  switch (accessory) {
    case 'glasses':
      return (
        <>
          <circle cx="84" cy="84" r="12" fill="none" stroke="#6B7280" strokeWidth="2.2" />
          <circle cx="116" cy="84" r="12" fill="none" stroke="#6B7280" strokeWidth="2.2" />
          <path d="M 96 84 H 104" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
        </>
      )
    case 'goggles':
      return (
        <>
          <ellipse cx="84" cy="78" rx="14" ry="10" fill="#60A5FA" opacity="0.75" stroke="#3B82F6" strokeWidth="2" />
          <ellipse cx="116" cy="78" rx="14" ry="10" fill="#60A5FA" opacity="0.75" stroke="#3B82F6" strokeWidth="2" />
          <path d="M 70 76 Q 84 68 84 76" stroke="#F5A623" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M 130 76 Q 116 68 116 76" stroke="#F5A623" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      )
    case 'book':
      return (
        <>
          <rect x="138" y="130" width="24" height="30" rx="3" fill="#2F855A" />
          <rect x="141" y="133" width="18" height="24" rx="1" fill="#FAFAFA" />
          <path d="M 150 133 L 150 157" stroke="#C9A227" strokeWidth="1.2" opacity="0.6" />
        </>
      )
    case 'telescope':
      return (
        <>
          <rect x="28" y="118" width="36" height="10" rx="5" fill="#4A5568" transform="rotate(-15 46 123)" />
          <circle cx="66" cy="108" r="9" fill="#374151" />
          <circle cx="66" cy="108" r="5" fill="#93C5FD" />
        </>
      )
    case 'star':
      return (
        <g transform="translate(128, 138)">
          <circle r="14" fill="#F5A623" opacity="0.9" />
          <path d="M 0 -8 L 2 0 L 9 0 L 3.2 4.5 L 5.5 11 L 0 7.5 L -5.5 11 L -3.2 4.5 L -9 0 L -2 0 Z" fill="#FFE082" />
        </g>
      )
    case 'backpack':
      return (
        <>
          <path d="M 68 132 Q 68 158 100 164 Q 132 158 132 132" fill="#3B5BDB" />
          <path d="M 76 132 L 76 118 Q 100 108 124 118 L 124 132" fill="none" stroke="#F5A623" strokeWidth="4" strokeLinecap="round" />
        </>
      )
    case 'rocket':
      return (
        <g transform="translate(148, 148) rotate(-20)">
          <path d="M 0 -14 L 6 8 L 0 4 L -6 8 Z" fill="#EF4444" />
          <rect x="-4" y="4" width="8" height="12" rx="2" fill="#F87171" />
          <circle cx="0" cy="0" r="3" fill="#93C5FD" />
        </g>
      )
    default:
      return null
  }
}

export default function AvatarPreview({ config, size = 160, className = '' }: AvatarPreviewProps) {
  const uid = useId().replace(/:/g, '')
  const clipId = `${uid}-clip`
  const headwearOpt = getHeadwearOption(config.headwear)
  const hairColor = headwearOpt?.color ?? HAIR_DEFAULT
  const hijabColor = headwearOpt?.category === 'hijab' ? (headwearOpt.color ?? '#2AAFA0') : '#2AAFA0'
  const showHairBack = !config.headwear.startsWith('hijab') && !config.headwear.startsWith('kufi')

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={`rounded-full shrink-0 ${className}`}
      role="img"
      aria-label="Avatar character"
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx="100" cy="100" r="100" />
        </clipPath>
        <linearGradient id={`${uid}-skin`} x1="0.35" y1="0" x2="0.65" y2="1">
          <stop offset="0%" stopColor={SKIN_HIGHLIGHT} />
          <stop offset="100%" stopColor={SKIN} />
        </linearGradient>
        <linearGradient id={`${uid}-hijab`} x1="0.3" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor={lightenColor(hijabColor, 0.1)} />
          <stop offset="100%" stopColor={shadeColor(hijabColor, 0.08)} />
        </linearGradient>
        <filter id={`${uid}-soft`} x="-8%" y="-8%" width="116%" height="116%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#09264A" floodOpacity="0.1" />
        </filter>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <BackgroundLayer id={uid} style={config.background} />
        <g filter={`url(#${uid}-soft)`}>
          <Body base={config.base} />
          <Neck />
          {showHairBack && <HairBack headwear={config.headwear} color={hairColor} />}
          <Face id={uid} />
          <Eyes />
          <NoseAndMouth />
          <HeadwearFront headwear={config.headwear} color={hairColor} id={uid} />
          <AccessoryLayer accessory={config.accessory} />
        </g>
      </g>
    </svg>
  )
}
