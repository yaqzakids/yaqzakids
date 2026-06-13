export const PASSWORD_REQUIREMENTS_MESSAGE =
  'Your password must be at least 12 characters and include uppercase, lowercase, a number, and a special character.'

export type PasswordRequirementId = 'length' | 'uppercase' | 'lowercase' | 'number' | 'special'

export interface PasswordRequirementCheck {
  id: PasswordRequirementId
  label: string
  met: boolean
}

export const PASSWORD_REQUIREMENT_LABELS: Record<PasswordRequirementId, string> = {
  length: 'At least 12 characters',
  uppercase: 'One uppercase letter',
  lowercase: 'One lowercase letter',
  number: 'One number',
  special: 'One special character',
}

export function getPasswordRequirementChecks(password: string): PasswordRequirementCheck[] {
  return [
    { id: 'length', label: PASSWORD_REQUIREMENT_LABELS.length, met: password.length >= 12 },
    { id: 'uppercase', label: PASSWORD_REQUIREMENT_LABELS.uppercase, met: /[A-Z]/.test(password) },
    { id: 'lowercase', label: PASSWORD_REQUIREMENT_LABELS.lowercase, met: /[a-z]/.test(password) },
    { id: 'number', label: PASSWORD_REQUIREMENT_LABELS.number, met: /\d/.test(password) },
    { id: 'special', label: PASSWORD_REQUIREMENT_LABELS.special, met: /[^A-Za-z0-9]/.test(password) },
  ]
}

export function isPasswordValid(password: string): boolean {
  return getPasswordRequirementChecks(password).every((check) => check.met)
}

export function passwordsMatch(password: string, confirmPassword: string): boolean {
  return password.length > 0 && password === confirmPassword
}

export function validateNewPassword(password: string, confirmPassword: string): string | null {
  if (!isPasswordValid(password)) {
    return PASSWORD_REQUIREMENTS_MESSAGE
  }
  if (!passwordsMatch(password, confirmPassword)) {
    return 'Passwords do not match.'
  }
  return null
}
