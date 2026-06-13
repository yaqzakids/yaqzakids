export const PRESET_AVATARS_ROOT = '/avatars/presets'

export const PRESET_AVATAR_IDS = [
  'afro-boy',
  'afro-girl',
  'asian-boy',
  'asian-girl',
  'blue-hijab',
  'boy',
  'boy-explorer',
  'boy-navy-kufi',
  'dark-boy',
  'dark-girl',
  'east-asian-boy',
  'east-asian-girl',
  'east-asian-green-hijab',
  'girl',
  'girl-book',
  'hijabi-black',
  'light-blue-hijab',
  'light-boy',
  'light-girl',
  'light-green-hijab',
  'medium-tone-boy',
  'medium-tone-girl',
  'pink-hijab',
  'purple-hijab',
  'purple-hijab-science',
  'science-girl',
  'south-asian-boy',
  'south-asian-girl',
  'south-asian-hijabi',
  'white-boy',
  'white-hijab',
  'yellow-hijab',
] as const

export type PresetAvatarId = (typeof PRESET_AVATAR_IDS)[number]

export interface PresetAvatar {
  id: PresetAvatarId
  name: string
}

export const PRESET_AVATARS: PresetAvatar[] = [
  { id: 'afro-boy', name: 'Afro Boy' },
  { id: 'afro-girl', name: 'Afro Girl' },
  { id: 'asian-boy', name: 'Asian Boy' },
  { id: 'asian-girl', name: 'Asian Girl' },
  { id: 'blue-hijab', name: 'Blue Hijab' },
  { id: 'boy', name: 'Boy' },
  { id: 'boy-explorer', name: 'Explorer Boy' },
  { id: 'boy-navy-kufi', name: 'Navy Kufi Boy' },
  { id: 'dark-boy', name: 'Dark Boy' },
  { id: 'dark-girl', name: 'Dark Girl' },
  { id: 'east-asian-boy', name: 'East Asian Boy' },
  { id: 'east-asian-girl', name: 'East Asian Girl' },
  { id: 'east-asian-green-hijab', name: 'Green Hijab Girl' },
  { id: 'girl', name: 'Girl' },
  { id: 'girl-book', name: 'Book Girl' },
  { id: 'hijabi-black', name: 'Black Hijab' },
  { id: 'light-blue-hijab', name: 'Light Blue Hijab' },
  { id: 'light-boy', name: 'Light Boy' },
  { id: 'light-girl', name: 'Light Girl' },
  { id: 'light-green-hijab', name: 'Mint Hijab' },
  { id: 'medium-tone-boy', name: 'Medium Tone Boy' },
  { id: 'medium-tone-girl', name: 'Medium Tone Girl' },
  { id: 'pink-hijab', name: 'Pink Hijab' },
  { id: 'purple-hijab', name: 'Purple Hijab' },
  { id: 'purple-hijab-science', name: 'Science Purple Hijab' },
  { id: 'science-girl', name: 'Scientist Girl' },
  { id: 'south-asian-boy', name: 'South Asian Boy' },
  { id: 'south-asian-girl', name: 'South Asian Girl' },
  { id: 'south-asian-hijabi', name: 'South Asian Hijabi' },
  { id: 'white-boy', name: 'White Boy' },
  { id: 'white-hijab', name: 'White Hijab' },
  { id: 'yellow-hijab', name: 'Yellow Hijab' },
]

const PRESET_ID_SET = new Set<string>(PRESET_AVATAR_IDS)

export function isPresetAvatarId(id: string | null | undefined): id is PresetAvatarId {
  return typeof id === 'string' && PRESET_ID_SET.has(id)
}

export function getPresetAvatar(id: string | null | undefined): PresetAvatar | undefined {
  if (!isPresetAvatarId(id)) return undefined
  return PRESET_AVATARS.find((avatar) => avatar.id === id)
}

export function getPresetAvatarImageUrl(id: PresetAvatarId): string {
  return `${PRESET_AVATARS_ROOT}/${id}.png`
}

export const DEFAULT_PRESET_AVATAR_ID: PresetAvatarId = 'light-blue-hijab'
