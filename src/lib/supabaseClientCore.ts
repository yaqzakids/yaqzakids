import { createClient } from '@supabase/supabase-js'
import {
  PUBLIC_SITE_URL,
  PUBLIC_SUPABASE_ANON_KEY,
  PUBLIC_SUPABASE_URL,
} from '@/generated/supabase.public'

function normalizeSupabaseProjectUrl(url: string): string {
  return url
    .trim()
    .replace(/\/rest\/v1\/?$/i, '')
    .replace(/\/+$/, '')
}

function isPlausibleSupabaseKey(key: string | undefined): boolean {
  const trimmed = (key ?? '').trim()
  if (!trimmed || trimmed === 'placeholder' || trimmed === 'your-anon-key') return false
  // Legacy JWT anon/service keys, or newer publishable keys
  return (
    (trimmed.startsWith('eyJ') && trimmed.length > 80) ||
    trimmed.startsWith('sb_publishable_')
  )
}

function resolveSupabaseUrl(): string {
  const fromEnv = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()
  if (fromEnv && !fromEnv.includes('placeholder') && !fromEnv.includes('your-project')) {
    return normalizeSupabaseProjectUrl(fromEnv)
  }
  return normalizeSupabaseProjectUrl(PUBLIC_SUPABASE_URL)
}

function resolveAnonKey(): string {
  const fromEnv = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim()
  if (isPlausibleSupabaseKey(fromEnv)) {
    return fromEnv!
  }
  if (isPlausibleSupabaseKey(PUBLIC_SUPABASE_ANON_KEY)) {
    return PUBLIC_SUPABASE_ANON_KEY
  }
  return fromEnv || PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
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
