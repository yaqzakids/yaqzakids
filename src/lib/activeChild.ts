import { STORAGE_KEYS as ADVENTURE_KEYS } from '@/lib/adventure/constants'
import { STORAGE_KEYS as APP_KEYS } from '@/lib/constants'
import type { AgeGroup } from '@/lib/types'

export const ACTIVE_CHILD_CHANGED = 'yaqza:active-child-changed'

export function persistActiveChildSelection(child: { id: string; age_group: AgeGroup }): void {
  localStorage.setItem(ADVENTURE_KEYS.selectedChildId, child.id)
  localStorage.setItem(ADVENTURE_KEYS.activeChild, child.id)
  localStorage.setItem(APP_KEYS.ageGroup, child.age_group)
  window.dispatchEvent(new CustomEvent(ACTIVE_CHILD_CHANGED))
}
