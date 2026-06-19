import PresetAvatarIllustration from '@/components/avatar/PresetAvatarIllustration'
import AvatarPreview from '@/components/avatar/AvatarPreview'
import { isPresetAvatarId } from '@/lib/avatar/presetAvatars'
import { hasAvatarConfig, parseAvatarConfig, type AvatarConfig } from '@/lib/avatarOptions'
import { dashboardTheme } from '@/lib/admin/dashboardTheme'

interface UserAvatarProps {
  name: string
  avatarId?: string | null
  avatarConfig?: AvatarConfig | unknown | null
  size?: number
  variant?: 'header' | 'sidebar' | 'profile' | 'default'
}

export default function UserAvatar({
  name,
  avatarId,
  avatarConfig,
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

  const parsedConfig = parseAvatarConfig(avatarConfig)
  if (hasAvatarConfig(parsedConfig)) {
    return (
      <div
        className="rounded-full overflow-hidden shrink-0"
        style={{ width: size, height: size }}
      >
        <AvatarPreview config={parsedConfig} size={size} />
      </div>
    )
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
