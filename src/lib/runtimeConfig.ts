export interface AppRuntimeConfig {
  supabaseUrl: string
  supabaseAnonKey: string
  siteUrl: string
}

export const PROJECT_SUPABASE_URL = 'https://cgvzeydhhkwosphixznd.supabase.co'
export const PROJECT_SITE_URL = 'https://www.yaqzakids.com'

function isValidSupabaseUrl(url: string): boolean {
  return Boolean(url) && !url.includes('placeholder') && !url.includes('your-project')
}

function isValidAnonKey(key: string): boolean {
  return Boolean(key) && key !== 'placeholder' && key !== 'your-anon-key'
}

function normalizeConfig(partial: Partial<AppRuntimeConfig>): AppRuntimeConfig {
  const supabaseUrl = isValidSupabaseUrl(partial.supabaseUrl ?? '')
    ? partial.supabaseUrl!.trim()
    : PROJECT_SUPABASE_URL

  const supabaseAnonKey = isValidAnonKey(partial.supabaseAnonKey ?? '')
    ? partial.supabaseAnonKey!.trim()
    : ''

  const siteUrl = (partial.siteUrl?.trim() || PROJECT_SITE_URL).replace(/\/$/, '')

  return { supabaseUrl, supabaseAnonKey, siteUrl }
}

export async function resolveRuntimeConfig(): Promise<AppRuntimeConfig> {
  const fromVite = normalizeConfig({
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string | undefined,
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined,
    siteUrl: import.meta.env.VITE_SITE_URL as string | undefined,
  })

  if (isValidAnonKey(fromVite.supabaseAnonKey)) {
    return fromVite
  }

  try {
    const response = await fetch('/runtime-config.json', { cache: 'no-store' })
    if (response.ok) {
      const json = (await response.json()) as Partial<AppRuntimeConfig>
      const merged = normalizeConfig({
        supabaseUrl: json.supabaseUrl ?? fromVite.supabaseUrl,
        supabaseAnonKey: json.supabaseAnonKey ?? fromVite.supabaseAnonKey,
        siteUrl: json.siteUrl ?? fromVite.siteUrl,
      })
      if (isValidAnonKey(merged.supabaseAnonKey)) {
        return merged
      }
    }
  } catch {
    // runtime-config.json unavailable during dev/offline
  }

  return fromVite
}

export function isRuntimeConfigValid(config: AppRuntimeConfig): boolean {
  return isValidSupabaseUrl(config.supabaseUrl) && isValidAnonKey(config.supabaseAnonKey)
}
