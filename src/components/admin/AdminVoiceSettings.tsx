import { useMemo } from 'react'
import { adminBtn, adminCard, adminInput, adminTextarea } from '@/lib/admin/styles'
import { AZURE_VOICES } from '@/lib/voice/azureVoices'
import { getElevenLabsVoicesForLanguage } from '@/lib/voice/elevenLabsVoices'
import { isElevenLabsAvailable } from '@/lib/voice/elevenLabsClient'
import { useElevenLabsVoiceCatalog } from '@/lib/voice/useElevenLabsVoiceCatalog'
import type { PronunciationEntry } from '@/lib/voice/types'
import {
  DEFAULT_PRONUNCIATION_ENTRIES,
  parsePronunciationDictionary,
  serializePronunciationDictionary,
} from '@/lib/voice/pronunciation'

const VOICE_SETTING_KEYS = new Set([
  'voice_enabled',
  'voice_provider',
  'voice_default_en',
  'voice_default_fr',
  'voice_default_ar',
  'voice_speaking_speed',
  'voice_pronunciation_dictionary',
])

interface AdminVoiceSettingsProps {
  values: Record<string, string>
  setValues: (next: Record<string, string>) => void
}

export function isVoiceSettingKey(key: string): boolean {
  return VOICE_SETTING_KEYS.has(key)
}

export default function AdminVoiceSettings({ values, setValues }: AdminVoiceSettingsProps) {
  const dictionary = useMemo(() => {
    const parsed = parsePronunciationDictionary(values.voice_pronunciation_dictionary)
    return parsed.length > 0 ? parsed : DEFAULT_PRONUNCIATION_ENTRIES
  }, [values.voice_pronunciation_dictionary])

  const provider = values.voice_provider ?? (isElevenLabsAvailable() ? 'elevenlabs' : 'azure')
  const { voices: elevenLabsCatalog, loading: elevenLabsLoading, error: elevenLabsError } =
    useElevenLabsVoiceCatalog(provider === 'elevenlabs' && isElevenLabsAvailable())

  const voiceCatalog = useMemo(() => {
    if (provider !== 'elevenlabs') return AZURE_VOICES
    return {
      en: getElevenLabsVoicesForLanguage(elevenLabsCatalog, 'en'),
      fr: getElevenLabsVoicesForLanguage(elevenLabsCatalog, 'fr'),
      ar: getElevenLabsVoicesForLanguage(elevenLabsCatalog, 'ar'),
    }
  }, [provider, elevenLabsCatalog])

  const updateDictionary = (entries: PronunciationEntry[]) => {
    setValues({
      ...values,
      voice_pronunciation_dictionary: serializePronunciationDictionary(entries),
    })
  }

  const updateEntry = (index: number, field: keyof PronunciationEntry, value: string) => {
    const next = dictionary.map((entry, i) =>
      i === index ? { ...entry, [field]: value } : entry
    )
    updateDictionary(next)
  }

  return (
    <div style={{ ...adminCard, marginBottom: 16 }}>
      <h2 style={{ margin: '0 0 16px', fontFamily: 'Playfair Display, serif', color: '#1B2F5E' }}>
        Voice Narration
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
        <div>
          <label className="block text-sm font-semibold mb-1">Voice Enabled</label>
          <select
            style={adminInput}
            value={values.voice_enabled ?? 'true'}
            onChange={(e) => setValues({ ...values, voice_enabled: e.target.value })}
          >
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Voice Provider</label>
          <select
            style={adminInput}
            value={provider}
            onChange={(e) => setValues({ ...values, voice_provider: e.target.value })}
          >
            <option value="elevenlabs">elevenlabs</option>
            <option value="azure">azure</option>
            <option value="browser">browser</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Default English Voice</label>
          <select
            style={adminInput}
            value={values.voice_default_en ?? voiceCatalog.en[0]?.id ?? ''}
            onChange={(e) => setValues({ ...values, voice_default_en: e.target.value })}
            disabled={provider === 'elevenlabs' && elevenLabsLoading}
          >
            {voiceCatalog.en.map((voice) => (
              <option key={voice.id} value={voice.id}>{voice.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Default French Voice</label>
          <select
            style={adminInput}
            value={values.voice_default_fr ?? voiceCatalog.fr[0]?.id ?? ''}
            onChange={(e) => setValues({ ...values, voice_default_fr: e.target.value })}
            disabled={provider === 'elevenlabs' && elevenLabsLoading}
          >
            {voiceCatalog.fr.map((voice) => (
              <option key={voice.id} value={voice.id}>{voice.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Default Arabic Voice</label>
          <select
            style={adminInput}
            value={values.voice_default_ar ?? voiceCatalog.ar[0]?.id ?? ''}
            onChange={(e) => setValues({ ...values, voice_default_ar: e.target.value })}
            disabled={provider === 'elevenlabs' && elevenLabsLoading}
          >
            {voiceCatalog.ar.map((voice) => (
              <option key={voice.id} value={voice.id}>{voice.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Speaking Speed</label>
          <select
            style={adminInput}
            value={values.voice_speaking_speed ?? '1'}
            onChange={(e) => setValues({ ...values, voice_speaking_speed: e.target.value })}
          >
            <option value="0.75">0.75</option>
            <option value="1">1</option>
            <option value="1.25">1.25</option>
          </select>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="text-sm font-semibold m-0">Pronunciation Dictionary</h3>
          <button
            type="button"
            style={adminBtn.secondary}
            onClick={() =>
              updateDictionary([...dictionary, { term: '', alias: '' }])
            }
          >
            + Add Entry
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          Pronunciation aliases apply to ElevenLabs plain-text narration and Azure SSML (e.g. Salman al-Farsi, Qur&apos;an, ﷺ).
        </p>

        <div className="space-y-2 max-w-4xl">
          {dictionary.map((entry, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2">
              <input
                style={adminInput}
                placeholder="Term (as written in articles)"
                value={entry.term}
                onChange={(e) => updateEntry(index, 'term', e.target.value)}
              />
              <input
                style={adminInput}
                placeholder="Speak as"
                value={entry.alias}
                onChange={(e) => updateEntry(index, 'alias', e.target.value)}
              />
              <button
                type="button"
                style={adminBtn.danger}
                onClick={() => updateDictionary(dictionary.filter((_, i) => i !== index))}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <details className="mt-4">
          <summary className="text-sm font-semibold cursor-pointer">Raw JSON</summary>
          <textarea
            style={{ ...adminTextarea, minHeight: 160, marginTop: 8 }}
            value={values.voice_pronunciation_dictionary ?? serializePronunciationDictionary(dictionary)}
            onChange={(e) =>
              setValues({ ...values, voice_pronunciation_dictionary: e.target.value })
            }
          />
        </details>
      </div>

      {provider === 'elevenlabs' && elevenLabsError && (
        <p className="text-sm text-amber-700 mt-4 mb-0">{elevenLabsError}</p>
      )}

      <p className="text-sm text-gray-600 mt-4 mb-0">
        ElevenLabs free plans can only use <strong>default</strong> voices via the API — not library voices.
        Voice lists are loaded from your ElevenLabs account. Set <code>VITE_ELEVENLABS_API_KEY</code> in{' '}
        <code>.env</code> and restart the dev server. Azure keys go in Supabase Edge Function secrets:{' '}
        <code>AZURE_SPEECH_KEY</code> and <code>AZURE_SPEECH_REGION</code>.
      </p>
    </div>
  )
}
