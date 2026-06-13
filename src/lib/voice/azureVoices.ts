import type { ReadAloudLanguage } from '@/lib/voice/types'

export interface AzureVoiceOption {
  id: string
  label: string
}

export const AZURE_VOICES: Record<ReadAloudLanguage, AzureVoiceOption[]> = {
  en: [
    { id: 'en-US-JennyNeural', label: 'Jenny (US English)' },
    { id: 'en-US-GuyNeural', label: 'Guy (US English)' },
    { id: 'en-US-AriaNeural', label: 'Aria (US English)' },
    { id: 'en-GB-SoniaNeural', label: 'Sonia (British English)' },
  ],
  fr: [
    { id: 'fr-FR-DeniseNeural', label: 'Denise (French)' },
    { id: 'fr-FR-HenriNeural', label: 'Henri (French)' },
    { id: 'fr-CA-SylvieNeural', label: 'Sylvie (Canadian French)' },
  ],
  ar: [
    { id: 'ar-SA-ZariyahNeural', label: 'Zariyah (Arabic Saudi)' },
    { id: 'ar-EG-SalmaNeural', label: 'Salma (Arabic Egypt)' },
    { id: 'ar-AE-FatimaNeural', label: 'Fatima (Arabic UAE)' },
  ],
}

export function getDefaultVoiceForLanguage(
  language: ReadAloudLanguage,
  settings: { defaultVoiceEn: string; defaultVoiceFr: string; defaultVoiceAr: string }
): string {
  if (language === 'fr') return settings.defaultVoiceFr
  if (language === 'ar') return settings.defaultVoiceAr
  return settings.defaultVoiceEn
}

export function getVoicesForLanguage(language: ReadAloudLanguage): AzureVoiceOption[] {
  return AZURE_VOICES[language]
}
