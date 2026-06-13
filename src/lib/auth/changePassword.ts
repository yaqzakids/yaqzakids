import { supabase } from '@/lib/supabase'
import { validateNewPassword } from '@/lib/auth/passwordPolicy'

export async function changeUserPassword(
  email: string,
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<void> {
  const validationError = validateNewPassword(newPassword, confirmPassword)
  if (validationError) {
    throw new Error(validationError)
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  })
  if (signInError) {
    throw new Error('Current password is incorrect.')
  }

  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
  if (updateError) {
    throw updateError
  }
}

export async function setRecoveredPassword(
  newPassword: string,
  confirmPassword: string
): Promise<void> {
  const validationError = validateNewPassword(newPassword, confirmPassword)
  if (validationError) {
    throw new Error(validationError)
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) {
    throw error
  }
}
