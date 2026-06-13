import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import {
  buildSsml,
  hashContent,
  parsePronunciationDictionary,
  resolveSpeakingRate,
  resolveVoiceName,
  type VoicePlatformSettings,
} from '../_shared/ssml.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const VOICE_KEYS = [
  'voice_provider',
  'voice_default_en',
  'voice_default_fr',
  'voice_default_ar',
  'voice_speaking_speed',
  'voice_pronunciation_dictionary',
] as const

interface TtsRequestBody {
  text?: string
  language?: string
  voice?: string
  speed?: number
  cacheKey?: string
  articleId?: string
  ageGroup?: string
}

async function loadVoiceSettings(supabase: ReturnType<typeof createClient>): Promise<Partial<VoicePlatformSettings>> {
  const { data } = await supabase.from('platform_settings').select('key, value').in('key', [...VOICE_KEYS])
  return Object.fromEntries((data ?? []).map((row) => [row.key, row.value])) as Partial<VoicePlatformSettings>
}

async function getCachedAudio(
  supabase: ReturnType<typeof createClient>,
  cacheKey: string
): Promise<ArrayBuffer | null> {
  const { data } = await supabase
    .from('tts_audio_cache')
    .select('storage_path')
    .eq('cache_key', cacheKey)
    .maybeSingle()

  if (!data?.storage_path) return null

  const { data: blob, error } = await supabase.storage.from('tts-cache').download(data.storage_path)
  if (error || !blob) return null
  return blob.arrayBuffer()
}

async function saveCachedAudio(
  supabase: ReturnType<typeof createClient>,
  cacheKey: string,
  audio: ArrayBuffer,
  meta: {
    articleId?: string
    language: string
    ageGroup?: string
    voiceName: string
    rate: number
    contentHash: string
  }
): Promise<void> {
  const storagePath = `${cacheKey.replace(/[^a-zA-Z0-9-_]/g, '_')}.mp3`

  const { error: uploadError } = await supabase.storage
    .from('tts-cache')
    .upload(storagePath, audio, { contentType: 'audio/mpeg', upsert: true })

  if (uploadError) return

  await supabase.from('tts_audio_cache').upsert({
    cache_key: cacheKey,
    article_id: meta.articleId ?? null,
    language: meta.language,
    age_group: meta.ageGroup ?? null,
    voice_name: meta.voiceName,
    speaking_rate: meta.rate,
    content_hash: meta.contentHash,
    storage_path: storagePath,
  })
}

async function synthesizeWithAzure(ssml: string, region: string, apiKey: string): Promise<ArrayBuffer> {
  const response = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': apiKey,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
      'User-Agent': 'YaqzaKidsTTS',
    },
    body: ssml,
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Azure TTS failed (${response.status}): ${detail}`)
  }

  return response.arrayBuffer()
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const azureKey = Deno.env.get('AZURE_SPEECH_KEY') ?? ''
    const azureRegion = Deno.env.get('AZURE_SPEECH_REGION') ?? ''

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)
    const body = (await req.json()) as TtsRequestBody
    const text = body.text?.trim()

    if (!text) {
      return new Response(JSON.stringify({ error: 'Text is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const language = body.language === 'fr' || body.language === 'ar' ? body.language : 'en'
    const settings = await loadVoiceSettings(supabase)

    if (settings.voice_provider === 'browser') {
      return new Response(JSON.stringify({ error: 'Browser provider selected', fallback: 'browser' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!azureKey || !azureRegion) {
      return new Response(JSON.stringify({ error: 'Azure TTS not configured', fallback: 'browser' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const voiceName = resolveVoiceName(language, body.voice, settings)
    const rate = resolveSpeakingRate(body.speed, settings)
    const dictionary = parsePronunciationDictionary(settings.voice_pronunciation_dictionary)
    const contentHash = await hashContent(`${text}:${language}:${voiceName}:${rate}:${JSON.stringify(dictionary)}`)
    const cacheKey =
      body.cacheKey?.trim() ||
      `tts:${contentHash}:${language}:${voiceName}:${rate}`

    const cached = await getCachedAudio(supabase, cacheKey)
    if (cached) {
      return new Response(cached, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'audio/mpeg',
          'X-TTS-Cache': 'hit',
          'X-TTS-Voice': voiceName,
        },
      })
    }

    const ssml = buildSsml({ text, language, voiceName, rate, dictionary })
    const audio = await synthesizeWithAzure(ssml, azureRegion, azureKey)

    await saveCachedAudio(supabase, cacheKey, audio, {
      articleId: body.articleId,
      language,
      ageGroup: body.ageGroup,
      voiceName,
      rate,
      contentHash,
    })

    return new Response(audio, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
        'X-TTS-Cache': 'miss',
        'X-TTS-Voice': voiceName,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'TTS synthesis failed'
    return new Response(JSON.stringify({ error: message, fallback: 'browser' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
