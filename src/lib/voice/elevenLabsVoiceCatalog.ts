import { getElevenLabsApiKey } from '@/lib/voice/elevenLabsClient'
import type { ReadAloudLanguage } from '@/lib/voice/types'

export interface ElevenLabsVoiceOption {
  id: string
  label: string
  language?: string
  category?: string
}

interface CachedCatalog {
  fetchedAt: number
  voices: ElevenLabsVoiceOption[]
}

interface ElevenLabsApiVoice {
  voice_id: string
  name: string
  category?: string
  labels?: Record<string, string>
}

interface VoicesV2Response {
  voices?: ElevenLabsApiVoice[]
}

const CACHE_KEY = 'yaqza:elevenlabs:voices'
const CACHE_TTL_MS = 60 * 60 * 1000

const LANGUAGE_HINTS: Record<ReadAloudLanguage, string[]> = {
  en: ['en', 'english'],
  fr: ['fr', 'french'],
  ar: ['ar', 'arabic'],
}

let inFlight: Promise<ElevenLabsVoiceOption[]> | null = null

function mapApiVoice(voice: ElevenLabsApiVoice): ElevenLabsVoiceOption {
  const language = voice.labels?.language
  const accent = voice.labels?.accent
  const details = [language, accent].filter(Boolean).join(', ')
  return {
    id: voice.voice_id,
    label: details ? `${voice.name} (${details})` : voice.name,
    language,
    category: voice.category,
  }
}

function readCache(): ElevenLabsVoiceOption[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachedCatalog
    if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) return null
    return parsed.voices.length > 0 ? parsed.voices : null
  } catch {
    return null
  }
}

function writeCache(voices: ElevenLabsVoiceOption[]) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ fetchedAt: Date.now(), voices }))
  } catch {
    // sessionStorage may be unavailable
  }
}

async function fetchVoiceType(apiKey: string, voiceType: string): Promise<ElevenLabsApiVoice[]> {
  const url = new URL('https://api.elevenlabs.io/v2/voices')
  url.searchParams.set('voice_type', voiceType)
  url.searchParams.set('page_size', '100')

  const response = await fetch(url.toString(), {
    headers: { 'xi-api-key': apiKey },
  })

  if (!response.ok) return []

  const payload = (await response.json()) as VoicesV2Response
  return payload.voices ?? []
}

async function fetchLegacyPremadeVoices(apiKey: string): Promise<ElevenLabsApiVoice[]> {
  const response = await fetch('https://api.elevenlabs.io/v1/voices', {
    headers: { 'xi-api-key': apiKey },
  })

  if (!response.ok) return []

  const payload = (await response.json()) as { voices?: ElevenLabsApiVoice[] }
  return (payload.voices ?? []).filter((voice) => {
    const category = voice.category?.toLowerCase()
    return category === 'premade' || category === 'cloned' || category === 'generated'
  })
}

function dedupeVoices(voices: ElevenLabsApiVoice[]): ElevenLabsVoiceOption[] {
  const seen = new Set<string>()
  return voices
    .filter((voice) => {
      if (!voice.voice_id || seen.has(voice.voice_id)) return false
      seen.add(voice.voice_id)
      return true
    })
    .map(mapApiVoice)
}

export async function fetchElevenLabsVoiceCatalog(force = false): Promise<ElevenLabsVoiceOption[]> {
  if (!force) {
    const cached = readCache()
    if (cached) return cached
  } else {
    clearElevenLabsVoiceCatalogCache()
  }

  if (inFlight) return inFlight

  inFlight = (async () => {
    const apiKey = getElevenLabsApiKey()
    if (!apiKey) return []

    const [defaults, personal] = await Promise.all([
      fetchVoiceType(apiKey, 'default'),
      fetchVoiceType(apiKey, 'personal'),
    ])

    let apiVoices = [...defaults, ...personal]

    if (apiVoices.length === 0) {
      apiVoices = await fetchLegacyPremadeVoices(apiKey)
    }

    const mapped = dedupeVoices(apiVoices)
    if (mapped.length > 0) writeCache(mapped)
    return mapped
  })()

  try {
    return await inFlight
  } finally {
    inFlight = null
  }
}

export function clearElevenLabsVoiceCatalogCache() {
  try {
    sessionStorage.removeItem(CACHE_KEY)
  } catch {
    // sessionStorage may be unavailable
  }
}

function voiceMatchesReadAloudLanguage(
  voice: ElevenLabsVoiceOption,
  language: ReadAloudLanguage
): boolean {
  if (!voice.language) return false
  const normalized = voice.language.toLowerCase()
  return LANGUAGE_HINTS[language].some((hint) => normalized.includes(hint))
}

export function getElevenLabsVoicesForLanguage(
  catalog: ElevenLabsVoiceOption[],
  language: ReadAloudLanguage
): ElevenLabsVoiceOption[] {
  if (catalog.length === 0) return []
  const matched = catalog.filter((voice) => voiceMatchesReadAloudLanguage(voice, language))
  return matched.length > 0 ? matched : catalog
}

export function getDefaultElevenLabsVoiceForLanguage(
  catalog: ElevenLabsVoiceOption[],
  language: ReadAloudLanguage
): string {
  const options = getElevenLabsVoicesForLanguage(catalog, language)
  return options[0]?.id ?? catalog[0]?.id ?? ''
}

export function isElevenLabsVoiceInCatalog(
  voiceId: string,
  catalog: ElevenLabsVoiceOption[]
): boolean {
  return catalog.some((voice) => voice.id === voiceId)
}

export function isAzureStyleVoiceId(voiceId: string): boolean {
  return /^(en|fr|ar)-/i.test(voiceId)
}

export function isElevenLabsLibraryVoiceError(message: string): boolean {
  return /library voices|upgrade your subscription/i.test(message)
}
