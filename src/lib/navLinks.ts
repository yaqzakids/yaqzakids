import {
  childHomePathForAgeGroup,
  profileDashboardPathForAgeGroup,
  AGE_GROUP_META,
} from '@/lib/childProfiles'
import type { AgeGroup, ChildProfile } from '@/lib/types'

export const PUBLIC_NAV_LINKS = [
  { label: 'Discover', to: '/discoverer' },
  { label: 'Learning Paths', to: '/paths' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'About', to: '/about' },
] as const

export const LEARNING_PATH_LINKS = [
  { label: 'Foundations of Faith', to: '/paths/foundations-of-faith' },
  { label: 'Science & Nature', to: '/paths/science-nature' },
  { label: 'History & Civilization', to: '/paths/history-civilization' },
  { label: 'Geography & Cultures', to: '/paths/geography-cultures' },
  { label: 'Technology & AI', to: '/paths/technology-ai' },
  { label: "Today's World", to: '/paths/todays-world' },
  { label: 'Environment & Stewardship', to: '/paths/environment-stewardship' },
] as const

export const DISCOVER_LINKS = [
  { label: 'Featured Stories', to: '/discover/featured' },
  { label: 'New This Week', to: '/discover/new' },
  { label: 'Most Popular', to: '/discover/popular' },
  { label: 'Recommended for You', to: '/discover/recommended' },
] as const

export const PROGRESS_LINKS = [
  { label: 'Achievements', to: '/achievements' },
  { label: 'Certificates', to: '/certificates' },
  { label: 'My Journey', to: '/journey' },
] as const

export interface ChildNavPaths {
  home: string
  journey: string
  profile: string
  profileAvatar: string
  achievements: string
  certificates: string
  explore: string
}

export function childNavPaths(child: ChildProfile): ChildNavPaths {
  const home = childHomePathForAgeGroup(child.age_group)
  const journey = profileDashboardPathForAgeGroup(child.age_group)

  if (child.age_group === 'discoverer') {
    return {
      home,
      journey,
      profile: '/discoverer/profile',
      profileAvatar: '/profile/avatar',
      achievements: '/discoverer/badges',
      certificates: '/discoverer/certificates',
      explore: '/discoverer/explore',
    }
  }

  return {
    home,
    journey,
    profile: journey,
    profileAvatar: `/children/${child.id}/edit`,
    achievements: journey,
    certificates: journey,
    explore: '/adventures',
  }
}

export function ageGroupBadgeClass(ageGroup: AgeGroup): string {
  if (ageGroup === 'explorer') return 'bg-[#FFF8ED] text-[#D4820A]'
  if (ageGroup === 'discoverer') return 'bg-[#EEF4FF] text-[#2AAFA0]'
  return 'bg-[#F3E8FF] text-[#8B6BB1]'
}

export function ageGroupLabel(ageGroup: AgeGroup): string {
  return AGE_GROUP_META[ageGroup].label
}

/** Routes where the global navbar is hidden (auth, admin, onboarding). */
export const NAVBAR_HIDDEN_PREFIXES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/onboarding',
  '/admin',
] as const

export function shouldShowGlobalNavbar(pathname: string): boolean {
  return !NAVBAR_HIDDEN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}
