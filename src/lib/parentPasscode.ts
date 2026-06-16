import { supabase } from '@/lib/supabase'
import {
  getStoredParentPinHash,
  hashParentPin,
  setParentPin as setLocalParentPin,
  verifyParentPin as verifyLocalParentPin,
} from '@/lib/parentGate'

export function isValidPasscode(passcode: string): boolean {
  return /^\d{4}$/.test(passcode)
}

export async function hasParentPasscode(userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('has_parent_passcode')
  if (!error && typeof data === 'boolean') {
    return data
  }
  return Boolean(getStoredParentPinHash(userId))
}

export async function setParentPasscode(passcode: string): Promise<void> {
  if (!isValidPasscode(passcode)) {
    throw new Error('Passcode must be exactly 4 digits.')
  }

  const { error } = await supabase.rpc('set_parent_passcode', { p_passcode: passcode })
  if (error) {
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id
    if (userId) {
      setLocalParentPin(userId, passcode)
      return
    }
    throw error
  }

  const { data: userData } = await supabase.auth.getUser()
  if (userData.user) {
    setLocalParentPin(userData.user.id, passcode)
  }
}

export async function verifyParentPasscode(userId: string, passcode: string): Promise<boolean> {
  if (!isValidPasscode(passcode)) return false

  const { data, error } = await supabase.rpc('verify_parent_passcode', { p_passcode: passcode })
  if (!error && data === true) return true
  if (!error && data === false) return false

  return verifyLocalParentPin(userId, passcode)
}

/** Sync check for legacy local-only PIN (prefer hasParentPasscode async). */
export function hasLocalParentPin(userId: string): boolean {
  return Boolean(getStoredParentPinHash(userId))
}

export { hashParentPin }
