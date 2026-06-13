import { supabase } from '@/lib/supabase'
import { logAdminAction } from './activity'

export interface PlatformSetting {
  id: string
  key: string
  value: string
  updated_at: string
}

export async function fetchPlatformSettings(): Promise<PlatformSetting[]> {
  const { data, error } = await supabase.from('platform_settings').select('*').order('key')
  if (error) throw error
  return data ?? []
}

export async function updatePlatformSettings(settings: { key: string; value: string }[]): Promise<void> {
  await Promise.all(
    settings.map(({ key, value }) =>
      supabase.from('platform_settings').upsert(
        { key, value, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      )
    )
  )
  await logAdminAction('settings_updated', 'settings', undefined, { keys: settings.map((s) => s.key) })
}
