import { getPresetAvatarImageUrl, type PresetAvatarId } from '@/lib/avatar/presetAvatars'

interface PresetAvatarIllustrationProps {
  id: PresetAvatarId
  size?: number
  className?: string
}

export default function PresetAvatarIllustration({
  id,
  size = 64,
  className = '',
}: PresetAvatarIllustrationProps) {
  return (
    <img
      src={getPresetAvatarImageUrl(id)}
      alt=""
      width={size}
      height={size}
      className={`rounded-full object-cover shrink-0 bg-white ${className}`}
      draggable={false}
    />
  )
}
