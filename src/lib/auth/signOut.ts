import { STORAGE_KEYS as ADVENTURE_STORAGE_KEYS } from '@/lib/adventure/constants'
import { STORAGE_KEYS as APP_STORAGE_KEYS } from '@/lib/constants'
import { lockParentSession } from '@/lib/parentGate'
import { supabase } from '@/lib/supabase'

/** Clear persisted child/session selection before or after Supabase sign-out. */
export function clearPersistedChildSession(): void {
  localStorage.removeItem(ADVENTURE_STORAGE_KEYS.selectedChildId)
  localStorage.removeItem(ADVENTURE_STORAGE_KEYS.activeChild)
  localStorage.removeItem(APP_STORAGE_KEYS.ageGroup)
}

export async function signOutAndClearLocalState(): Promise<void> {
  clearPersistedChildSession()
  lockParentSession()
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
