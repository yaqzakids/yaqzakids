import { supabase } from '@/lib/supabase'
import type { TtsSynthesisRequest } from '@/lib/voice/types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export class TtsRequestError extends Error {
  fallback: 'browser' | null

  constructor(message: string, fallback: 'browser' | null = null) {
    super(message)
    this.name = 'TtsRequestError'
    this.fallback = fallback
  }
}

export async function synthesizeSpeech(request: TtsSynthesisRequest): Promise<Blob> {
  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token ?? supabaseAnonKey

  const response = await fetch(`${supabaseUrl}/functions/v1/tts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      apikey: supabaseAnonKey,
    },
    body: JSON.stringify(request),
  })

  if (response.ok) {
    const contentType = response.headers.get('Content-Type') ?? ''
    const blob = await response.blob()

    if (!contentType.includes('audio') && blob.type.includes('json')) {
      const payload = (await blob.text()) as string
      try {
        const parsed = JSON.parse(payload) as { error?: string; fallback?: string }
        throw new TtsRequestError(
          parsed.error ?? 'TTS returned invalid audio',
          parsed.fallback === 'browser' ? 'browser' : null
        )
      } catch (error) {
        if (error instanceof TtsRequestError) throw error
        throw new TtsRequestError('TTS returned invalid audio', 'browser')
      }
    }

    if (blob.size < 128) {
      throw new TtsRequestError('TTS returned empty audio', 'browser')
    }

    return blob
  }

  let fallback: 'browser' | null = null
  let message = `TTS request failed (${response.status})`

  try {
    const payload = (await response.json()) as { error?: string; fallback?: string }
    if (payload.error) message = payload.error
    if (payload.fallback === 'browser') fallback = 'browser'
  } catch {
    // Response body was not JSON (unlikely)
  }

  throw new TtsRequestError(message, fallback)
}
