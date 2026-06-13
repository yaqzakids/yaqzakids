import UserAvatar from '@/components/UserAvatar'

interface AdminAvatarProps {
  name: string
  avatarId?: string | null
  size?: number
  variant?: 'header' | 'sidebar' | 'profile'
}

export default function AdminAvatar({
  name,
  avatarId,
  size = 36,
  variant = 'header',
}: AdminAvatarProps) {
  return (
    <UserAvatar
      name={name}
      avatarId={avatarId}
      size={size}
      variant={variant}
    />
  )
}
