/** Avatar Builder — selectable preset parts inspired by Yaqza Kids asset reference */

export type AvatarBaseId = 'boy' | 'girl'

export type HeadwearId =
  | 'hair-boy-short'
  | 'hair-boy-curly'
  | 'hair-girl-bob'
  | 'hair-girl-long'
  | 'hair-girl-long-blonde'
  | 'hair-short-blonde'
  | 'hijab-sky'
  | 'hijab-pink'
  | 'hijab-navy'
  | 'hijab-mint'
  | 'hijab-lavender'
  | 'hijab-yellow'
  | 'hijab-teal'
  | 'hijab-white'
  | 'kufi-white'
  | 'kufi-navy'
  | 'kufi-tan'

export type AccessoryId =
  | 'none'
  | 'glasses'
  | 'goggles'
  | 'book'
  | 'telescope'
  | 'star'
  | 'backpack'
  | 'rocket'

export type BackgroundId = 'stars' | 'nature' | 'library' | 'geometric'

export type HeadwearCategory = 'hair' | 'hijab' | 'kufi'

export interface AvatarConfig {
  base: AvatarBaseId
  headwear: HeadwearId
  accessory: AccessoryId
  background: BackgroundId
}

export interface AvatarBaseOption {
  id: AvatarBaseId
  label: string
}

export interface HeadwearOption {
  id: HeadwearId
  label: string
  category: HeadwearCategory
  /** Which base this headwear is designed for */
  forBase: AvatarBaseId | 'both'
  color?: string
}

export interface AccessoryOption {
  id: AccessoryId
  label: string
}

export interface BackgroundOption {
  id: BackgroundId
  label: string
}

export const AVATAR_BASE_OPTIONS: AvatarBaseOption[] = [
  { id: 'boy', label: 'Boy' },
  { id: 'girl', label: 'Girl' },
]

export const HEADWEAR_OPTIONS: HeadwearOption[] = [
  { id: 'hair-boy-short', label: 'Short Hair', category: 'hair', forBase: 'boy', color: '#4A3228' },
  { id: 'hair-boy-curly', label: 'Afro Hair', category: 'hair', forBase: 'boy', color: '#1F2937' },
  { id: 'hair-girl-bob', label: 'Bob Hair', category: 'hair', forBase: 'girl', color: '#5C4033' },
  { id: 'hair-girl-long', label: 'Long Black Hair', category: 'hair', forBase: 'girl', color: '#4A3228' },
  { id: 'hair-girl-long-blonde', label: 'Long Blonde Hair', category: 'hair', forBase: 'girl', color: '#E8C872' },
  { id: 'hair-short-blonde', label: 'Short Blonde Hair', category: 'hair', forBase: 'both', color: '#F0D890' },
  { id: 'hijab-sky', label: 'Sky Blue', category: 'hijab', forBase: 'girl', color: '#7EC8E3' },
  { id: 'hijab-pink', label: 'Soft Pink', category: 'hijab', forBase: 'girl', color: '#F4A7B9' },
  { id: 'hijab-navy', label: 'Navy Blue', category: 'hijab', forBase: 'girl', color: '#1E3A5F' },
  { id: 'hijab-mint', label: 'Mint Green', category: 'hijab', forBase: 'girl', color: '#7EC8B0' },
  { id: 'hijab-lavender', label: 'Lavender', category: 'hijab', forBase: 'girl', color: '#B794F6' },
  { id: 'hijab-yellow', label: 'Sunny Yellow', category: 'hijab', forBase: 'girl', color: '#F6D860' },
  { id: 'hijab-teal', label: 'Teal', category: 'hijab', forBase: 'girl', color: '#2AAFA0' },
  { id: 'hijab-white', label: 'White', category: 'hijab', forBase: 'girl', color: '#F7F7F7' },
  { id: 'kufi-white', label: 'White Kufi', category: 'kufi', forBase: 'boy', color: '#FFFFFF' },
  { id: 'kufi-navy', label: 'Navy Kufi', category: 'kufi', forBase: 'boy', color: '#1E3A5F' },
  { id: 'kufi-tan', label: 'Tan Kufi', category: 'kufi', forBase: 'boy', color: '#C4A574' },
]

export const ACCESSORY_OPTIONS: AccessoryOption[] = [
  { id: 'none', label: 'None' },
  { id: 'glasses', label: 'Glasses' },
  { id: 'goggles', label: 'Goggles' },
  { id: 'book', label: 'Book' },
  { id: 'telescope', label: 'Telescope' },
  { id: 'star', label: 'Star Pin' },
  { id: 'backpack', label: 'Backpack' },
  { id: 'rocket', label: 'Rocket' },
]

export const BACKGROUND_OPTIONS: BackgroundOption[] = [
  { id: 'stars', label: 'Starry Night' },
  { id: 'nature', label: 'Nature' },
  { id: 'library', label: 'Library' },
  { id: 'geometric', label: 'Geometric' },
]

export const AVATAR_BUILDER_TABS = [
  { id: 'base', label: 'Base' },
  { id: 'hijab', label: 'Hijab' },
  { id: 'hair', label: 'Hair' },
  { id: 'accessory', label: 'Accessory' },
  { id: 'background', label: 'Background' },
] as const

export type AvatarBuilderTab = (typeof AVATAR_BUILDER_TABS)[number]['id']

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  base: 'girl',
  headwear: 'hijab-sky',
  accessory: 'none',
  background: 'stars',
}

const VALID_BASE: AvatarBaseId[] = ['boy', 'girl']
const VALID_HEADWEAR = HEADWEAR_OPTIONS.map((h) => h.id)
const VALID_ACCESSORY = ACCESSORY_OPTIONS.map((a) => a.id)
const VALID_BACKGROUND = BACKGROUND_OPTIONS.map((b) => b.id)

export function getHeadwearOption(id: HeadwearId): HeadwearOption | undefined {
  return HEADWEAR_OPTIONS.find((h) => h.id === id)
}

export function getHeadwearForCategory(category: HeadwearCategory, base: AvatarBaseId): HeadwearOption[] {
  return HEADWEAR_OPTIONS.filter((h) => {
    if (h.category !== category) return false
    if (h.forBase === 'both') return true
    return h.forBase === base
  })
}

export function getDefaultHeadwearForBase(base: AvatarBaseId): HeadwearId {
  return base === 'boy' ? 'hair-boy-short' : 'hair-girl-bob'
}

export function isHeadwearValidForBase(headwear: HeadwearId, base: AvatarBaseId): boolean {
  const opt = getHeadwearOption(headwear)
  if (!opt) return false
  if (opt.forBase === 'both') return true
  return opt.forBase === base
}

export function normalizeConfigForBase(config: AvatarConfig): AvatarConfig {
  if (isHeadwearValidForBase(config.headwear, config.base)) return config
  return { ...config, headwear: getDefaultHeadwearForBase(config.base) }
}

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function randomizeAvatarConfig(): AvatarConfig {
  const base = pickRandom(VALID_BASE)
  const headwearPool = HEADWEAR_OPTIONS.filter(
    (h) => h.forBase === base || h.forBase === 'both',
  )
  return {
    base,
    headwear: pickRandom(headwearPool).id,
    accessory: pickRandom(VALID_ACCESSORY),
    background: pickRandom(VALID_BACKGROUND),
  }
}

/** Migrate legacy layered config keys to the new preset schema */
function migrateLegacyConfig(raw: Record<string, unknown>): AvatarConfig | null {
  const hair = raw.hair as string | undefined
  const outfit = typeof raw.outfitColor === 'string' ? raw.outfitColor : '#2AAFA0'

  let base: AvatarBaseId = 'girl'
  let headwear: HeadwearId = 'hair-girl-bob'

  if (hair === 'kufi') {
    base = 'boy'
    headwear = outfit.includes('1E') || outfit.toLowerCase().includes('navy') ? 'kufi-navy' : 'kufi-white'
  } else if (hair === 'hijab') {
    base = 'girl'
    if (outfit.includes('F4') || outfit.toLowerCase().includes('pink')) headwear = 'hijab-pink'
    else if (outfit.includes('B7') || outfit.toLowerCase().includes('lavender')) headwear = 'hijab-lavender'
    else if (outfit.includes('F5') || outfit.toLowerCase().includes('gold')) headwear = 'hijab-yellow'
    else headwear = 'hijab-teal'
  } else if (hair === 'curly') {
    base = 'boy'
    headwear = 'hair-boy-curly'
  } else if (hair === 'short' || hair === 'cap') {
    base = 'boy'
    headwear = 'hair-boy-short'
  } else if (hair === 'none') {
    headwear = 'hair-girl-long'
  }

  const accessoryMap: Record<string, AccessoryId> = {
    none: 'none',
    glasses: 'glasses',
    book: 'book',
    telescope: 'telescope',
    star: 'star',
    backpack: 'backpack',
  }

  const bgMap: Record<string, BackgroundId> = {
    stars: 'stars',
    books: 'library',
    nature: 'nature',
    space: 'stars',
    geometric: 'geometric',
  }

  const accessory = accessoryMap[raw.accessory as string] ?? 'none'
  const background = bgMap[raw.background as string] ?? 'stars'

  return normalizeConfigForBase({ base, headwear, accessory, background })
}

export function parseAvatarConfig(raw: unknown): AvatarConfig | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>

  if (
    typeof o.base === 'string' && VALID_BASE.includes(o.base as AvatarBaseId) &&
    typeof o.headwear === 'string' && VALID_HEADWEAR.includes(o.headwear as HeadwearId) &&
    typeof o.accessory === 'string' && VALID_ACCESSORY.includes(o.accessory as AccessoryId) &&
    typeof o.background === 'string' && VALID_BACKGROUND.includes(o.background as BackgroundId)
  ) {
    return normalizeConfigForBase({
      base: o.base as AvatarBaseId,
      headwear: o.headwear as HeadwearId,
      accessory: o.accessory as AccessoryId,
      background: o.background as BackgroundId,
    })
  }

  if ('hair' in o || 'faceShape' in o) {
    return migrateLegacyConfig(o)
  }

  return null
}

export function hasAvatarConfig(config: AvatarConfig | null | undefined): config is AvatarConfig {
  return config !== null && config !== undefined
}

export function shadeColor(hex: string, amount = 0.15): string {
  const n = hex.replace('#', '')
  const num = parseInt(n.length === 3 ? n.split('').map((c) => c + c).join('') : n, 16)
  const r = Math.max(0, ((num >> 16) & 0xff) * (1 - amount))
  const g = Math.max(0, ((num >> 8) & 0xff) * (1 - amount))
  const b = Math.max(0, (num & 0xff) * (1 - amount))
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`
}

export function lightenColor(hex: string, amount = 0.12): string {
  const n = hex.replace('#', '')
  const num = parseInt(n.length === 3 ? n.split('').map((c) => c + c).join('') : n, 16)
  const r = Math.min(255, ((num >> 16) & 0xff) + 255 * amount)
  const g = Math.min(255, ((num >> 8) & 0xff) + 255 * amount)
  const b = Math.min(255, (num & 0xff) + 255 * amount)
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`
}
