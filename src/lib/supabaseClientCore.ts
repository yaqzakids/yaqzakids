import { createClient } from '@supabase/supabase-js'
import {
  PUBLIC_SITE_URL,
  PUBLIC_SUPABASE_ANON_KEY,
  PUBLIC_SUPABASE_URL,
} from '@/generated/supabase.public'

function resolveSupabaseUrl(): string {
  const fromEnv = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()
  if (fromEnv && !fromEnv.includes('placeholder') && !fromEnv.includes('your-project')) {
    return fromEnv
  }
  return PUBLIC_SUPABASE_URL
}

function resolveAnonKey(): string {
  const fromEnv = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim()
  if (fromEnv && fromEnv !== 'placeholder' && fromEnv !== 'your-anon-key') {
    return fromEnv
  }
  return PUBLIC_SUPABASE_ANON_KEY
}

export function getActiveSiteUrl(): string {
  const fromEnv = (import.meta.env.VITE_SITE_URL as string | undefined)?.trim()
  return (fromEnv || PUBLIC_SITE_URL).replace(/\/$/, '')
}

export const SUPABASE_CONFIG_ERROR =
  'This site is not connected to Supabase yet. Run npm run prebuild, redeploy, and verify src/generated/supabase.public.ts.'

export function isSupabaseReady(): boolean {
  const key = resolveAnonKey()
  return Boolean(key && key !== 'placeholder' && key !== 'your-anon-key')
}

export const supabase = createClient(resolveSupabaseUrl(), resolveAnonKey() || 'placeholder', {
  auth: {
    detectSessionInUrl: true,
  },
})
