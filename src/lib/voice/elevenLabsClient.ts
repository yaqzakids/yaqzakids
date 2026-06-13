import { chunkSpeechText } from '@/lib/voice/chunkSpeechText'
import type { ReadAloudLanguage } from '@/lib/voice/types'

export class ElevenLabsRequestError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ElevenLabsRequestError'
  }
}

export function getElevenLabsApiKey(): string | null {
  const key = import.meta.env.VITE_ELEVENLABS_API_KEY?.trim()
  return key || null
}

export function isElevenLabsAvailable(): boolean {
  return !!getElevenLabsApiKey()
}

const LANGUAGE_CODES: Record<ReadAloudLanguage, string> = {
  en: 'en',
  fr: 'fr',
  ar: 'ar',
}

export async function synthesizeElevenLabs(params: {
  text: string
  voiceId: string
  language: ReadAloudLanguage
  speed?: number
}): Promise<Blob> {
  const apiKey = getElevenLabsApiKey()
  if (!apiKey) {
    throw new ElevenLabsRequestError('ElevenLabs API key not configured')
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(params.voiceId)}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text: params.text,
        model_id: 'eleven_multilingual_v2',
        language_code: LANGUAGE_CODES[params.language],
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.75,
          speed: params.speed ?? 1,
        },
      }),
    }
  )

  if (!response.ok) {
    let detail = `ElevenLabs failed (${response.status})`
    try {
      const payload = (await response.json()) as { detail?: { message?: string } | string }
      if (typeof payload.detail === 'string') detail = payload.detail
      else if (payload.detail?.message) detail = payload.detail.message
    } catch {
      // Response body was not JSON
    }
    throw new ElevenLabsRequestError(detail)
  }

  const blob = await response.blob()
  if (blob.size < 128) {
    throw new ElevenLabsRequestError('ElevenLabs returned empty audio')
  }

  return blob
}

export async function synthesizeElevenLabsLong(params: {
  text: string
  voiceId: string
  language: ReadAloudLanguage
  speed?: number
}): Promise<Blob[]> {
  const chunks = chunkSpeechText(params.text, 3500)
  if (chunks.length === 0) {
    throw new ElevenLabsRequestError('No text to synthesize')
  }

  const blobs: Blob[] = []
  for (const chunk of chunks) {
    blobs.push(
      await synthesizeElevenLabs({
        text: chunk,
        voiceId: params.voiceId,
        language: params.language,
        speed: params.speed,
      })
    )
  }

  return blobs
}
