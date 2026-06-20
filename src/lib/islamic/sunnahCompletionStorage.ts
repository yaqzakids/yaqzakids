import { dateKey } from '@/lib/islamic/dailyReminders'

const STORAGE_PREFIX = 'yaqza_sunnah_complete'

function storageKey(childId: string, sunnahId: string, day = dateKey()): string {
  return `${STORAGE_PREFIX}:${childId}:${day}:${sunnahId}`
}

export function isSunnahCompleted(childId: string, sunnahId: string, day = dateKey()): boolean {
  try {
    return localStorage.getItem(storageKey(childId, sunnahId, day)) === '1'
  } catch {
    return false
  }
}

export function markSunnahCompleted(childId: string, sunnahId: string, day = dateKey()): void {
  try {
    localStorage.setItem(storageKey(childId, sunnahId, day), '1')
  } catch {
    // ignore quota / private mode
  }
}

/**
 * TODO: Persist reward_points to Supabase when daily_reminders + child rewards API exist.
 */
export function getSunnahRewardPoints(): number {
  return 5
}
