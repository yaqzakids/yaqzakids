export interface PronunciationEntry {
  term: string
  alias: string
}

export interface VoicePlatformSettings {
  voice_provider: string
  voice_default_en: string
  voice_default_fr: string
  voice_default_ar: string
  voice_speaking_speed: string
  voice_pronunciation_dictionary: string
}

const LANGUAGE_SSML: Record<string, string> = {
  en: 'en-US',
  fr: 'fr-FR',
  ar: 'ar-SA',
}

const DEFAULT_VOICES: Record<string, string> = {
  en: 'en-US-JennyNeural',
  fr: 'fr-FR-DeniseNeural',
  ar: 'ar-SA-ZariyahNeural',
}

export function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function parsePronunciationDictionary(raw: string | undefined): PronunciationEntry[] {
  if (!raw?.trim()) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((entry) => entry?.term && entry?.alias)
      .map((entry) => ({ term: String(entry.term), alias: String(entry.alias) }))
  } catch {
    return []
  }
}

export function applyPronunciationDictionary(text: string, entries: PronunciationEntry[]): string {
  let result = escapeXml(text)
  const sorted = [...entries].sort((a, b) => b.term.length - a.term.length)

  for (const entry of sorted) {
    const escapedTerm = entry.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const replacement = `<sub alias="${escapeXml(entry.alias)}">${escapeXml(entry.term)}</sub>`
    result = result.replace(new RegExp(escapedTerm, 'gi'), replacement)
  }

  return result
}

export function resolveVoiceName(
  language: string,
  requestedVoice: string | undefined,
  settings: Partial<VoicePlatformSettings>
): string {
  const defaultVoice =
    language === 'fr'
      ? settings.voice_default_fr ?? DEFAULT_VOICES.fr
      : language === 'ar'
      ? settings.voice_default_ar ?? DEFAULT_VOICES.ar
      : settings.voice_default_en ?? DEFAULT_VOICES.en

  if (requestedVoice?.trim()) {
    const voice = requestedVoice.trim()
    const prefix = language === 'fr' ? 'fr-' : language === 'ar' ? 'ar-' : 'en-'
    if (voice.toLowerCase().startsWith(prefix)) return voice
  }

  return defaultVoice
}

export function resolveSpeakingRate(
  requestedSpeed: number | undefined,
  settings: Partial<VoicePlatformSettings>
): number {
  if (requestedSpeed && requestedSpeed > 0) return requestedSpeed
  const parsed = Number(settings.voice_speaking_speed)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

export function buildSsml(params: {
  text: string
  language: string
  voiceName: string
  rate: number
  dictionary: PronunciationEntry[]
}): string {
  const xmlLang = LANGUAGE_SSML[params.language] ?? LANGUAGE_SSML.en
  const body = applyPronunciationDictionary(params.text, params.dictionary)

  return [
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${xmlLang}">`,
    `<voice name="${escapeXml(params.voiceName)}">`,
    `<prosody rate="${params.rate}">${body}</prosody>`,
    '</voice>',
    '</speak>',
  ].join('')
}

export async function hashContent(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16)
}
