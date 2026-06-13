import PresetAvatarIllustration from '@/components/avatar/PresetAvatarIllustration'
import { isPresetAvatarId } from '@/lib/avatar/presetAvatars'
import { dashboardTheme } from '@/lib/admin/dashboardTheme'

interface UserAvatarProps {
  name: string
  avatarId?: string | null
  size?: number
  variant?: 'header' | 'sidebar' | 'profile' | 'default'
}

export default function UserAvatar({
  name,
  avatarId,
  size = 36,
  variant = 'default',
}: UserAvatarProps) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const initialsBackground =
    variant === 'sidebar'
      ? dashboardTheme.gold
      : variant === 'profile' || variant === 'header'
        ? dashboardTheme.navy
        : 'rgba(26, 39, 68, 0.1)'

  const initialsColor =
    variant === 'sidebar' ? dashboardTheme.sidebar : variant === 'default' ? dashboardTheme.navy : '#fff'

  if (isPresetAvatarId(avatarId)) {
    return <PresetAvatarIllustration id={avatarId} size={size} />
  }

  return (
    <div
      className="rounded-full flex items-center justify-center font-bold shrink-0"
      style={{
        width: size,
        height: size,
        background: initialsBackground,
        color: initialsColor,
        fontSize: Math.max(10, Math.round(size * 0.32)),
      }}
    >
      {initials || '?'}
    </div>
  )
}
