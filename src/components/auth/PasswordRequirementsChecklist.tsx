import { getPasswordRequirementChecks } from '@/lib/auth/passwordPolicy'

const AUTH_INPUT_CLASS =
  'w-full px-4 py-3 border-[1.5px] border-gray-200 rounded-xl focus:border-teal focus:outline-none transition-colors'

interface PasswordRequirementsChecklistProps {
  password: string
  className?: string
}

export default function PasswordRequirementsChecklist({
  password,
  className = '',
}: PasswordRequirementsChecklistProps) {
  const checks = getPasswordRequirementChecks(password)

  return (
    <ul className={`space-y-1.5 ${className}`} aria-live="polite">
      {checks.map((check) => (
        <li
          key={check.id}
          className={`flex items-center gap-2 text-[13px] leading-snug ${
            check.met ? 'text-teal font-semibold' : 'text-muted'
          }`}
        >
          <span aria-hidden className="w-4 shrink-0 text-center">
            {check.met ? '✓' : '☐'}
          </span>
          <span>{check.label}</span>
        </li>
      ))}
    </ul>
  )
}

export { AUTH_INPUT_CLASS }
