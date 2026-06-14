import { IMAGES } from '@/lib/constants'

export const SITE_SEO = {
  brandName: 'YaqzaKids',
  missionStatement: "Tomorrow's Ummah",
  tagline: 'Rooted in Faith. Awake to the World.',
  siteName: 'YaqzaKids',
  title: 'YaqzaKids | Tomorrow\'s Ummah',
  description:
    'Rooted in Faith. Awake to the World. YaqzaKids is a safe educational platform helping Muslim children explore science, history, technology, nature, and today\'s world through curiosity, critical thinking, and Islamic values.',
  keywords:
    'YaqzaKids, Muslim children, Islamic education, science for kids, history for kids, technology for kids, educational platform, Muslim homeschool, Islamic learning, children\'s learning platform',
  openGraph: {
    title: 'YaqzaKids | Tomorrow\'s Ummah',
    description:
      'Rooted in Faith. Awake to the World. Helping Muslim children explore science, history, technology, nature, and the world through curiosity and Islamic values.',
  },
  twitter: {
    title: 'YaqzaKids | Tomorrow\'s Ummah',
    description:
      'Rooted in Faith. Awake to the World. A safe learning platform helping Muslim children discover science, history, technology, and the world through an Islamic worldview.',
  },
  siteUrl: (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '') ?? 'https://www.yaqzakids.com',
  defaultImage: IMAGES.welcomeBg,
  locale: 'en_US',
  twitterCard: 'summary_large_image' as const,
} as const

export interface PageSeoOptions {
  title?: string
  description?: string
  path?: string
  image?: string
  noIndex?: boolean
}

export function buildPageTitle(pageTitle?: string): string {
  if (!pageTitle?.trim()) return SITE_SEO.title
  return `${pageTitle.trim()} | ${SITE_SEO.brandName} | ${SITE_SEO.missionStatement}`
}

export function buildCanonicalUrl(path = '/'): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${SITE_SEO.siteUrl}${normalized === '/' ? '' : normalized}` || SITE_SEO.siteUrl
}

/** Page-specific SEO presets for public routes */
export const PAGE_SEO_PRESETS = {
  home: {},
  welcome: {},
  parents: {
    title: 'For Parents',
    description:
      'Support your child\'s learning with YaqzaKids — a safe platform rooted in faith where Muslim children explore science, history, technology, and the world.',
  },
  about: {
    title: 'About',
    description:
      'Learn about YaqzaKids — Tomorrow\'s Ummah. Rooted in Faith. Awake to the World. Islamic education for curious Muslim children.',
  },
  pricing: {
    title: 'Pricing',
    description:
      'Simple family plans for YaqzaKids — unlimited learning paths, quizzes, and parent tools to help Muslim children grow with Islamic values.',
  },
  signup: {
    title: 'Sign Up',
    description:
      'Create your free YaqzaKids parent account and start your child\'s learning journey — rooted in faith, awake to the world.',
  },
  login: {
    title: 'Sign In',
    description:
      'Sign in to YaqzaKids to manage child profiles, track progress, and continue learning.',
  },
  sampleStories: {
    title: 'Sample Stories',
    description:
      'Preview curated YaqzaKids stories and adventures that spark curiosity in Muslim children.',
  },
} as const satisfies Record<string, PageSeoOptions>
