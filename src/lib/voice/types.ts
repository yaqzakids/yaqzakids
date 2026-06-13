export type ReadAloudLanguage = 'en' | 'fr' | 'ar'
export type VoiceProvider = 'browser' | 'azure' | 'elevenlabs'

export interface PronunciationEntry {
  term: string
  alias: string
}

export interface VoiceSettings {
  voiceEnabled: boolean
  voiceProvider: VoiceProvider
  defaultVoiceEn: string
  defaultVoiceFr: string
  defaultVoiceAr: string
  speakingSpeed: number
  pronunciationDictionary: PronunciationEntry[]
}

export interface TtsSynthesisRequest {
  text: string
  language: ReadAloudLanguage
  voice?: string
  speed?: number
  cacheKey?: string
  articleId?: string
  ageGroup?: string
}

export type PlaybackStatus = 'stopped' | 'loading' | 'playing' | 'paused'
