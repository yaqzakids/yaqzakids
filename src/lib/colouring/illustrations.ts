import { IMAGES } from '@/lib/images'

export type ColouringBadge = 'Science & Nature' | 'Foundations of Faith'

export interface ColouringIllustration {
  id: string
  title: string
  badge: ColouringBadge
  imagePath: string
}

export const COLOURING_ILLUSTRATIONS: ColouringIllustration[] = [
  {
    id: 'eid-celebration',
    title: 'Eid Celebration',
    badge: 'Foundations of Faith',
    imagePath: '/colouring/eid-celebration.png',
  },
  {
    id: 'helping-elderly-neighbour',
    title: 'Giving Food to the Needy',
    badge: 'Foundations of Faith',
    imagePath: '/colouring/helping-elderly-neighbour.png',
  },
  {
    id: 'kindness-is-sadaqah',
    title: 'Kindness is Sadaqah',
    badge: 'Foundations of Faith',
    imagePath: '/colouring/kindness-is-sadaqah.png',
  },
  {
    id: 'learning-good-character',
    title: 'Learning Good Character',
    badge: 'Foundations of Faith',
    imagePath: '/colouring/learning-good-character.png',
  },
  {
    id: 'making-duaa',
    title: 'Making Duaa',
    badge: 'Foundations of Faith',
    imagePath: '/colouring/making-duaa.png',
  },
  {
    id: 'reading-quran',
    title: 'Reading the Quran',
    badge: 'Foundations of Faith',
    imagePath: '/colouring/reading-quran.png',
  },
  {
    id: 'respecting-parents',
    title: 'Respecting Parents',
    badge: 'Foundations of Faith',
    imagePath: '/colouring/respecting-parents.png',
  },
  {
    id: 'steps-of-wudu',
    title: 'Steps of Wudu',
    badge: 'Foundations of Faith',
    imagePath: '/colouring/steps-of-wudu.png',
  },
  {
    id: 'five-daily-prayers',
    title: 'The Five Daily Prayers',
    badge: 'Foundations of Faith',
    imagePath: '/colouring/five-daily-prayers.png',
  },
  {
    id: 'masjid-al-haram',
    title: 'Masjid Al-Haram',
    badge: 'Foundations of Faith',
    imagePath: '/colouring/masjid-al-haram.png',
  },
  {
    id: 'masjid-al-aqsa',
    title: 'Masjid Al-Aqsa',
    badge: 'Foundations of Faith',
    imagePath: '/colouring/masjid-al-aqsa.png',
  },
  {
    id: 'masjid-al-aqsa-dome',
    title: 'Masjid Al-Aqsa — Dome of the Rock',
    badge: 'Foundations of Faith',
    imagePath: '/colouring/masjid-al-aqsa-dome.png',
  },
  {
    id: 'masjid-an-nabawi',
    title: 'Al-Masjid an-Nabawi',
    badge: 'Foundations of Faith',
    imagePath: '/colouring/masjid-an-nabawi.png',
  },
  {
    id: 'mosque-community-day',
    title: 'Mosque Community Day',
    badge: 'Foundations of Faith',
    imagePath: '/colouring/mosque-community-day.png',
  },
  {
    id: 'planting-trees',
    title: 'Planting Trees for Tomorrow',
    badge: 'Science & Nature',
    imagePath: '/colouring/planting-trees.png',
  },
]

/** Organized light → dark within each hue; duplicates removed */
export const COLOUR_PALETTE_GROUPS = [
  {
    label: 'Reds & Pinks',
    colors: ['#FFE4E1', '#FCA5A5', '#F9A8D4', '#EC4899', '#E85D4A', '#EF4444', '#DC2626', '#BE185D'],
  },
  {
    label: 'Oranges & Golds',
    colors: ['#FFFBF0', '#FFEFD5', '#FDE68A', '#FBBF24', '#F5A623', '#F97316', '#EAB308', '#DAA520', '#C2410C'],
  },
  {
    label: 'Yellows & Lime',
    colors: ['#FEF08A', '#F0E68C', '#84CC16', '#CA8A04'],
  },
  {
    label: 'Greens',
    colors: ['#BBF7D0', '#22C55E', '#2E8B57', '#15803D', '#166534', '#006400'],
  },
  {
    label: 'Teals & Cyans',
    colors: ['#A5F3FC', '#E0FFFF', '#2AAFA0', '#14B8A6', '#06B6D4', '#0F766E', '#008080'],
  },
  {
    label: 'Blues',
    colors: ['#EEF4FF', '#DBEAFE', '#93C5FD', '#3B82F6', '#4682B4', '#1D4ED8', '#1B2F5E', '#191970'],
  },
  {
    label: 'Purples',
    colors: ['#FCE7F3', '#E6E6FA', '#C4B5FD', '#8B6BB1', '#A855F7', '#6366F1', '#6D28D9', '#4B0082'],
  },
  {
    label: 'Skin & Earth',
    colors: ['#FFDAB9', '#F5CBA7', '#E8B88A', '#D2A679', '#CD853F', '#BC8F8F', '#A16207', '#92400E', '#654321', '#44403C'],
  },
  {
    label: 'Neutrals',
    colors: ['#FFFFFF', '#D1D5DB', '#9CA3AF', '#708090', '#6B7280', '#374151', '#2F4F4F', '#1F2937', '#000000'],
  },
] as const

export const COLOUR_PALETTE = COLOUR_PALETTE_GROUPS.flatMap((group) => group.colors)

export const COLOURING_TOOLS = [
  { id: 'fill', label: 'Fill', emoji: '🖌️' },
  { id: 'pencil', label: 'Pencil', emoji: '✏️' },
  { id: 'brush', label: 'Brush', emoji: '🖊️' },
  { id: 'marker', label: 'Marker', emoji: '🖍️' },
  { id: 'crayon', label: 'Crayon', emoji: '🎨' },
  { id: 'spray', label: 'Spray', emoji: '💨' },
  { id: 'eraser', label: 'Eraser', emoji: '🧽' },
] as const

export const BRUSH_SIZES = {
  small: 4,
  medium: 10,
  large: 20,
  xlarge: 32,
} as const

export type ColouringTool = (typeof COLOURING_TOOLS)[number]['id']
export type BrushSize = keyof typeof BRUSH_SIZES

export function illustrationById(id: string): ColouringIllustration | undefined {
  return COLOURING_ILLUSTRATIONS.find((item) => item.id === id)
}

export function badgeColor(badge: ColouringBadge): string {
  return badge === 'Foundations of Faith' ? '#8B6BB1' : '#16a34a'
}

export const YAQZA_LOGO_URL = IMAGES.logo
