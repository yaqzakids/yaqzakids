import PasswordRequirementsChecklist, { AUTH_INPUT_CLASS } from '@/components/auth/PasswordRequirementsChecklist'
import { passwordsMatch } from '@/lib/auth/passwordPolicy'

interface PasswordCreateFieldsProps {
  password: string
  confirmPassword: string
  onPasswordChange: (value: string) => void
  onConfirmPasswordChange: (value: string) => void
  passwordPlaceholder?: string
  confirmPlaceholder?: string
  showMismatchError?: boolean
}

export default function PasswordCreateFields({
  password,
  confirmPassword,
  onPasswordChange,
  onConfirmPasswordChange,
  passwordPlaceholder = 'Password',
  confirmPlaceholder = 'Confirm password',
  showMismatchError = true,
}: PasswordCreateFieldsProps) {
  const mismatch =
    showMismatchError && confirmPassword.length > 0 && !passwordsMatch(password, confirmPassword)

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <input
          type="password"
          placeholder={passwordPlaceholder}
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          required
          autoComplete="new-password"
          className={AUTH_INPUT_CLASS}
        />
        <PasswordRequirementsChecklist password={password} />
      </div>
      <div className="space-y-1">
        <input
          type="password"
          placeholder={confirmPlaceholder}
          value={confirmPassword}
          onChange={(e) => onConfirmPasswordChange(e.target.value)}
          required
          autoComplete="new-password"
          className={AUTH_INPUT_CLASS}
        />
        {mismatch && (
          <p className="text-coral text-[13px] font-semibold">Passwords do not match.</p>
        )}
      </div>
    </div>
  )
}
