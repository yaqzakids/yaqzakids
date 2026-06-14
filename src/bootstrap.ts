import { initSupabase } from '@/lib/supabase'
import { isRuntimeConfigValid, resolveRuntimeConfig } from '@/lib/runtimeConfig'

export async function bootstrapApp(): Promise<void> {
  const config = await resolveRuntimeConfig()
  initSupabase(config)

  if (!isRuntimeConfigValid(config)) {
    console.error(
      '[YaqzaKids] Supabase is not configured. Ensure public/assets/runtime-config.json exists with supabaseAnonKey, or set VITE_SUPABASE_* env vars at build time.',
    )
  }
}
