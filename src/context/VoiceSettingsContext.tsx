import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { DEFAULT_VOICE_SETTINGS, fetchVoiceSettings } from '@/lib/platform/voiceSettings'
import type { VoiceSettings } from '@/lib/voice/types'

interface VoiceSettingsContextValue {
  settings: VoiceSettings
  loading: boolean
  refresh: () => Promise<void>
}

const VoiceSettingsContext = createContext<VoiceSettingsContextValue>({
  settings: DEFAULT_VOICE_SETTINGS,
  loading: true,
  refresh: async () => {},
})

export function VoiceSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<VoiceSettings>(DEFAULT_VOICE_SETTINGS)
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    const next = await fetchVoiceSettings().catch(() => DEFAULT_VOICE_SETTINGS)
    setSettings(next)
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false))
  }, [])

  return (
    <VoiceSettingsContext.Provider value={{ settings, loading, refresh }}>
      {children}
    </VoiceSettingsContext.Provider>
  )
}

export function useVoiceSettings() {
  return useContext(VoiceSettingsContext)
}

/** @deprecated Use useVoiceSettings().settings.voiceEnabled */
export function useVoiceEnabled() {
  const { settings, loading } = useVoiceSettings()
  return { voiceEnabled: settings.voiceEnabled, loading }
}
