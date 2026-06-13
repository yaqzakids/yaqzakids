import { getDefaultVoiceForLanguage } from '@/lib/voice/azureVoices'
import {
  getDefaultElevenLabsVoiceForLanguage,
  isAzureStyleVoiceId,
  isElevenLabsVoiceInCatalog,
  type ElevenLabsVoiceOption,
} from '@/lib/voice/elevenLabsVoices'
import { voiceMatchesLanguage } from '@/lib/voice/language'
import type { ReadAloudLanguage, VoiceSettings } from '@/lib/voice/types'

export function resolveCloudVoice(
  provider: 'azure' | 'elevenlabs',
  language: ReadAloudLanguage,
  settings: Pick<VoiceSettings, 'defaultVoiceEn' | 'defaultVoiceFr' | 'defaultVoiceAr'>,
  selectedVoice: string,
  elevenLabsCatalog: ElevenLabsVoiceOption[] = []
): string {
  if (provider === 'elevenlabs') {
    if (selectedVoice && isElevenLabsVoiceInCatalog(selectedVoice, elevenLabsCatalog)) {
      return selectedVoice
    }

    const configured = getDefaultVoiceForLanguage(language, settings)
    if (
      configured &&
      !isAzureStyleVoiceId(configured) &&
      isElevenLabsVoiceInCatalog(configured, elevenLabsCatalog)
    ) {
      return configured
    }

    return getDefaultElevenLabsVoiceForLanguage(elevenLabsCatalog, language)
  }

  if (selectedVoice && voiceMatchesLanguage(selectedVoice, language)) {
    return selectedVoice
  }
  return getDefaultVoiceForLanguage(language, settings)
}

export function cloudVoiceMatchesProvider(
  voiceId: string,
  provider: 'azure' | 'elevenlabs',
  language: ReadAloudLanguage,
  elevenLabsCatalog: ElevenLabsVoiceOption[] = []
): boolean {
  return provider === 'elevenlabs'
    ? isElevenLabsVoiceInCatalog(voiceId, elevenLabsCatalog)
    : voiceMatchesLanguage(voiceId, language)
}
