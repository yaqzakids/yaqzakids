import { supabase } from '@/lib/supabase'
import { isElevenLabsAvailable } from '@/lib/voice/elevenLabsClient'
import { DEFAULT_PRONUNCIATION_ENTRIES, parsePronunciationDictionary } from '@/lib/voice/pronunciation'
import type { VoiceProvider, VoiceSettings } from '@/lib/voice/types'

const VOICE_SETTING_KEYS = [
  'voice_enabled',
  'voice_provider',
  'voice_default_en',
  'voice_default_fr',
  'voice_default_ar',
  'voice_speaking_speed',
  'voice_pronunciation_dictionary',
] as const

const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  voiceEnabled: true,
  voiceProvider: isElevenLabsAvailable() ? 'elevenlabs' : 'azure',
  defaultVoiceEn: 'en-US-JennyNeural',
  defaultVoiceFr: 'fr-FR-DeniseNeural',
  defaultVoiceAr: 'ar-SA-ZariyahNeural',
  speakingSpeed: 1,
  pronunciationDictionary: DEFAULT_PRONUNCIATION_ENTRIES,
}

function mapVoiceProvider(raw: string | undefined): VoiceProvider {
  if (raw === 'browser') return 'browser'
  if (raw === 'elevenlabs') return 'elevenlabs'
  if (raw === 'azure') return 'azure'
  return isElevenLabsAvailable() ? 'elevenlabs' : 'azure'
}

function mapVoiceSettings(values: Record<string, string>): VoiceSettings {
  const speed = Number(values.voice_speaking_speed)
  const dictionary = parsePronunciationDictionary(values.voice_pronunciation_dictionary)

  return {
    voiceEnabled: values.voice_enabled !== 'false',
    voiceProvider: mapVoiceProvider(values.voice_provider),
    defaultVoiceEn: values.voice_default_en || DEFAULT_VOICE_SETTINGS.defaultVoiceEn,
    defaultVoiceFr: values.voice_default_fr || DEFAULT_VOICE_SETTINGS.defaultVoiceFr,
    defaultVoiceAr: values.voice_default_ar || DEFAULT_VOICE_SETTINGS.defaultVoiceAr,
    speakingSpeed: Number.isFinite(speed) && speed > 0 ? speed : DEFAULT_VOICE_SETTINGS.speakingSpeed,
    pronunciationDictionary:
      dictionary.length > 0 ? dictionary : DEFAULT_VOICE_SETTINGS.pronunciationDictionary,
  }
}

export async function fetchVoiceSettings(): Promise<VoiceSettings> {
  const { data, error } = await supabase
    .from('platform_settings')
    .select('key, value')
    .in('key', [...VOICE_SETTING_KEYS])

  if (error || !data) return DEFAULT_VOICE_SETTINGS

  const values = Object.fromEntries(data.map((row) => [row.key, row.value]))
  return mapVoiceSettings(values)
}

export { DEFAULT_VOICE_SETTINGS }
