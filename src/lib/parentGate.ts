import { PARENT_UNLOCK_MS, STORAGE_KEYS } from '@/lib/adventure/constants'

function pinStorageKey(userId: string): string {
  return `${STORAGE_KEYS.parentPinPrefix}${userId}`
}

export function hashParentPin(pin: string): string {
  return btoa(`yaqza-pin:${pin.trim()}`)
}

export function getStoredParentPinHash(userId: string): string | null {
  return localStorage.getItem(pinStorageKey(userId))
}

export function setParentPin(userId: string, pin: string): void {
  localStorage.setItem(pinStorageKey(userId), hashParentPin(pin))
}

export function verifyParentPin(userId: string, pin: string): boolean {
  const stored = getStoredParentPinHash(userId)
  if (!stored) return false
  return stored === hashParentPin(pin)
}

export function hasParentPin(userId: string): boolean {
  return Boolean(getStoredParentPinHash(userId))
}

export function isParentUnlocked(): boolean {
  const raw = sessionStorage.getItem(STORAGE_KEYS.parentUnlockUntil)
  if (!raw) return false
  const until = Number(raw)
  if (!Number.isFinite(until) || Date.now() > until) {
    sessionStorage.removeItem(STORAGE_KEYS.parentUnlockUntil)
    return false
  }
  return true
}

export function unlockParentSession(): void {
  sessionStorage.setItem(
    STORAGE_KEYS.parentUnlockUntil,
    String(Date.now() + PARENT_UNLOCK_MS)
  )
}

export function lockParentSession(): void {
  sessionStorage.removeItem(STORAGE_KEYS.parentUnlockUntil)
}
