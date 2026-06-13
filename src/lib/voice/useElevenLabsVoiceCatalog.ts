import { useCallback, useEffect, useState } from 'react'
import { isElevenLabsAvailable } from '@/lib/voice/elevenLabsClient'
import {
  fetchElevenLabsVoiceCatalog,
  type ElevenLabsVoiceOption,
} from '@/lib/voice/elevenLabsVoiceCatalog'

export function useElevenLabsVoiceCatalog(enabled = true) {
  const [voices, setVoices] = useState<ElevenLabsVoiceOption[]>([])
  const [loading, setLoading] = useState(enabled && isElevenLabsAvailable())
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async (force = false) => {
    if (!isElevenLabsAvailable()) {
      setVoices([])
      setLoading(false)
      return []
    }

    setLoading(true)
    setError(null)

    try {
      const catalog = await fetchElevenLabsVoiceCatalog(force)
      setVoices(catalog)
      if (catalog.length === 0) {
        setError(
          'No default ElevenLabs voices found for your account. Free plans cannot use library voices via the API — upgrade or switch to browser voice.'
        )
      }
      return catalog
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not load ElevenLabs voices.'
      setError(message)
      setVoices([])
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!enabled || !isElevenLabsAvailable()) {
      setLoading(false)
      return
    }
    void refresh(false)
  }, [enabled, refresh])

  return { voices, loading, error, refresh }
}
