export type {
  AvatarBaseId,
  HeadwearId,
  AccessoryId,
  BackgroundId,
  HeadwearCategory,
  AvatarConfig,
  AvatarBuilderTab,
} from '@/lib/avatarOptions'

export {
  AVATAR_BASE_OPTIONS,
  HEADWEAR_OPTIONS,
  ACCESSORY_OPTIONS,
  BACKGROUND_OPTIONS,
  AVATAR_BUILDER_TABS,
  DEFAULT_AVATAR_CONFIG,
  getHeadwearOption,
  getHeadwearForCategory,
  getDefaultHeadwearForBase,
  isHeadwearValidForBase,
  normalizeConfigForBase,
  randomizeAvatarConfig,
  parseAvatarConfig,
  hasAvatarConfig,
  shadeColor,
  lightenColor,
} from '@/lib/avatarOptions'
