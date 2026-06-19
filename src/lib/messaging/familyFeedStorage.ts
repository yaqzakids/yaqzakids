const STORAGE_PREFIX = 'yaqza_family_feed_state'

interface FeedState {
  read: string[]
  archived: string[]
}

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}:${userId}`
}

function loadState(userId: string): FeedState {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return { read: [], archived: [] }
    const parsed = JSON.parse(raw) as Partial<FeedState>
    return {
      read: Array.isArray(parsed.read) ? parsed.read : [],
      archived: Array.isArray(parsed.archived) ? parsed.archived : [],
    }
  } catch {
    return { read: [], archived: [] }
  }
}

function saveState(userId: string, state: FeedState): void {
  localStorage.setItem(storageKey(userId), JSON.stringify(state))
}

export function isSyntheticFeedItemRead(userId: string, itemId: string): boolean {
  return loadState(userId).read.includes(itemId)
}

export function isSyntheticFeedItemArchived(userId: string, itemId: string): boolean {
  return loadState(userId).archived.includes(itemId)
}

export function markSyntheticFeedItemRead(userId: string, itemId: string): void {
  const state = loadState(userId)
  if (!state.read.includes(itemId)) {
    state.read.push(itemId)
    saveState(userId, state)
  }
}

export function archiveSyntheticFeedItem(userId: string, itemId: string): void {
  const state = loadState(userId)
  if (!state.archived.includes(itemId)) {
    state.archived.push(itemId)
    saveState(userId, state)
  }
}

export function unarchiveSyntheticFeedItem(userId: string, itemId: string): void {
  const state = loadState(userId)
  state.archived = state.archived.filter((id) => id !== itemId)
  saveState(userId, state)
}

export function markSyntheticFeedItemUnread(userId: string, itemId: string): void {
  const state = loadState(userId)
  state.read = state.read.filter((id) => id !== itemId)
  saveState(userId, state)
}
