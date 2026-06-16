/** Points awarded for milestones (Stars in UI, points in DB) */
export const POINTS = {
  ARTICLE_READ: 10,
  QUIZ_PASS: 25,
  PATH_COMPLETE: 100,
  BADGE_UNLOCK: 50,
} as const

export const QUIZ_PASSING_SCORE = 70

export const STORAGE_KEYS = {
  selectedChildId: 'yaqza_selected_child_id',
  activeChild: 'yaqza_active_child',
  parentPinPrefix: 'yaqza_parent_pin_',
  parentUnlockUntil: 'yaqza_parent_unlock_until',
} as const

export const PARENT_UNLOCK_MS = 15 * 60 * 1000
