/** Curated Discoverer homepage content — signed-out marketing vs signed-in personalized */

export interface DiscovererStoryCard {
  title: string
  category: string
  description: string
  image: string
  readingTime: number
  ageTag: string
  starsReward?: number
  url: string
}

export interface DiscovererFeaturedStory {
  category: string
  title: string
  description: string
  image: string
  readingTime: number
  ageTag: string
  url: string
  ctaLabel: string
}

export const SIGNED_OUT_FEATURED_STORY: DiscovererFeaturedStory = {
  category: 'Science & Nature',
  title: 'Why Bees Matter',
  description:
    'Bees are tiny, but they do an enormous job! They help plants grow, food thrive, and nature stay in balance.',
  image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&q=80',
  readingTime: 6,
  ageTag: 'Ages 9–12',
  url: '/sample-stories',
  ctaLabel: 'Read Now →',
}

export const SIGNED_OUT_FEATURED_SIDEBAR: {
  title: string
  category: string
  image: string
  url: string
}[] = [
  {
    title: 'The Great Library of Baghdad',
    category: 'History',
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=80',
    url: '/sample-stories',
  },
  {
    title: 'What is Artificial Intelligence?',
    category: 'Technology',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&q=80',
    url: '/sample-stories',
  },
  {
    title: 'Exploring the Amazon Rainforest',
    category: 'Geography',
    image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=600&q=80',
    url: '/sample-stories',
  },
]

export const SIGNED_IN_FEATURED_STORY: DiscovererFeaturedStory = {
  category: 'Science & Nature',
  title: 'Why Bees Matter',
  description:
    'Bees are tiny, but they do an enormous job. They help plants grow, food thrive, and nature stay balanced.',
  image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&q=80',
  readingTime: 6,
  ageTag: 'Ages 9–12',
  url: '/adventures/articles/why-bees-matter',
  ctaLabel: 'Read Story →',
}

export const SIGNED_OUT_SAMPLE_STORIES: Omit<DiscovererStoryCard, 'readingTime' | 'starsReward'>[] = [
  {
    title: 'Salman al-Farisi — The Boy Who Searched for the Truth',
    category: 'History & Faith',
    description: 'A curious boy who traveled far to find the truth about God.',
    image: 'https://i.ibb.co/HfGGfqTb/Chat-GPT-Image-Jun-4-2026-02-40-58-PM.png',
    ageTag: 'Ages 9–12',
    url: '/adventures/search-for-truth/salman-al-farisi',
  },
  {
    title: 'Rain Is a Blessing',
    category: 'Signs of Allah in Nature',
    description: 'Every drop of rain is a mercy from Allah that helps plants grow.',
    image: 'https://i.ibb.co/HDhQ9Wxk/Chat-GPT-Image-Jun-4-2026-02-47-50-PM.png',
    ageTag: 'Ages 9–12',
    url: '/adventures/signs-in-nature/rain-blessing',
  },
  {
    title: 'Pyramids of Egypt',
    category: 'History & Civilization',
    description: 'Ancient wonders that still stand — and what they teach us today.',
    image: 'https://i.ibb.co/ns4zjTjM/Chat-GPT-Image-Jun-4-2026-02-44-34-PM.png',
    ageTag: 'Ages 9–12',
    url: '/adventures/ancient-egypt/pyramids-egypt',
  },
]

export const SIGNED_IN_RECOMMENDED: DiscovererStoryCard[] = [
  {
    title: 'The Amazing Human Brain',
    category: 'Science & Nature',
    description: 'Discover how your brain learns, remembers, and helps you grow.',
    image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&q=80',
    readingTime: 7,
    ageTag: 'Ages 9–12',
    starsReward: 15,
    url: '/adventures/articles/the-amazing-human-brain',
  },
  {
    title: 'What Is Climate Change?',
    category: 'Environment',
    description: 'Learn how our planet is changing and what we can do to help.',
    image: 'https://images.unsplash.com/photo-1611273426858-450c8e160c0a?w=600&q=80',
    readingTime: 8,
    ageTag: 'Ages 9–12',
    starsReward: 20,
    url: '/adventures/articles/what-is-climate-change',
  },
  {
    title: 'The Great Migrations',
    category: 'Geography & Cultures',
    description: 'Follow incredible journeys of people and animals across the world.',
    image: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=600&q=80',
    readingTime: 6,
    ageTag: 'Ages 9–12',
    starsReward: 15,
    url: '/adventures/articles/the-great-migrations',
  },
  {
    title: 'Islamic Golden Age of Invention',
    category: 'History & Civilization',
    description: 'Meet scholars who shaped science, medicine, and learning for the world.',
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=80',
    readingTime: 9,
    ageTag: 'Ages 9–12',
    starsReward: 25,
    url: '/adventures/articles/islamic-golden-age-of-invention',
  },
]

/** Short article URLs → full adventure article paths (or explore fallback) */
export const DISCOVERER_ARTICLE_SHORT_PATHS: Record<string, string> = {
  'why-bees-matter': '/adventures/wonders-creation/amazing-ocean',
  'the-amazing-human-brain': '/adventures/wonders-creation/amazing-ocean',
  'what-is-climate-change': '/adventures/wonders-creation/amazing-ocean',
  'the-great-migrations': '/adventures/ancient-egypt/pyramids-egypt',
  'islamic-golden-age-of-invention': '/adventures/search-for-truth/salman-al-farisi',
}

export function resolveDiscovererArticleShortPath(articleSlug: string): string {
  return DISCOVERER_ARTICLE_SHORT_PATHS[articleSlug] ?? '/discoverer/explore'
}
