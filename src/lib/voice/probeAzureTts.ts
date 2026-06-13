import { supabase } from '@/lib/supabase'

const AZURE_UNAVAILABLE_KEY = 'yaqza-tts-azure-unavailable'
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export function isAzureMarkedUnavailable(): boolean {
  try {
    return sessionStorage.getItem(AZURE_UNAVAILABLE_KEY) === '1'
  } catch {
    return false
  }
}

export function markAzureUnavailable(): void {
  try {
    sessionStorage.setItem(AZURE_UNAVAILABLE_KEY, '1')
  } catch {
    // Ignore
  }
}

export function clearAzureUnavailableMark(): void {
  try {
    sessionStorage.removeItem(AZURE_UNAVAILABLE_KEY)
  } catch {
    // Ignore
  }
}

/** Ping TTS once per session so the first Play click can skip Azure when not deployed. */
export async function probeAzureTtsAvailability(): Promise<boolean> {
  if (isAzureMarkedUnavailable()) return false

  try {
    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData.session?.access_token ?? supabaseAnonKey

    const response = await fetch(`${supabaseUrl}/functions/v1/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify({ text: 'Hi', language: 'en' }),
    })

    if (response.ok) {
      const contentType = response.headers.get('Content-Type') ?? ''
      if (contentType.includes('audio')) return true
    }

    markAzureUnavailable()
    return false
  } catch {
    markAzureUnavailable()
    return false
  }
}
