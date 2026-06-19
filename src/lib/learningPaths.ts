export interface LearningPathDefinition {
  name: string
  slug: string
  icon: string
  color: string
  description: string
  mission: string
  whatYouLearn: string[]
  sampleLessons: string[]
  ageGroups: ('Explorer' | 'Discoverer' | 'Thinker')[]
  islamicThemes: string[]
  /** Linked adventure_paths.slug when configured in admin */
  adventureSlug: string
  coverImageUrl: string
}

export const LEARNING_PATHS: LearningPathDefinition[] = [
  {
    name: 'Foundations of Faith',
    slug: 'foundations-of-faith',
    icon: '🕌',
    color: '#8B6BB1',
    description: 'Build a strong connection with Allah and Islamic values',
    mission: 'Build a strong Islamic foundation through stories of prophets, values, and purpose.',
    whatYouLearn: [
      'Stories of the prophets and righteous companions',
      'Core Islamic values: honesty, patience, and gratitude',
      'How faith connects to everyday choices',
      'Reflection questions rooted in the Qur\'an and Sunnah',
    ],
    sampleLessons: ['Salman al-Farisi — The Boy Who Searched for Truth', 'Mus\'ab ibn Umayr — Courage Over Comfort', 'Signs of Allah in Nature'],
    ageGroups: ['Explorer', 'Discoverer', 'Thinker'],
    islamicThemes: ['Tawhid', 'Prophetic stories', 'Character (akhlaq)', 'Purposeful living'],
    adventureSlug: 'search-for-truth',
    coverImageUrl: '/paths/covers/foundations-of-faith.png',
  },
  {
    name: 'Science & Nature',
    slug: 'science-nature',
    icon: '🔬',
    color: '#16a34a',
    description: "Explore the wonders of Allah's creation through science",
    mission: 'Explore animals, plants, space, and the wonders of creation with curiosity and awe.',
    whatYouLearn: [
      'How ecosystems and animals work together',
      'Space, weather, and natural phenomena',
      'Scientific thinking and observation skills',
      'Seeing creation as a sign of Allah\'s power',
    ],
    sampleLessons: ['Wonders of the Ocean', 'Rain — A Blessing from the Sky', 'Amazing Animal Adaptations'],
    ageGroups: ['Explorer', 'Discoverer', 'Thinker'],
    islamicThemes: ['Signs in creation (ayat)', 'Stewardship (khilafah)', 'Gratitude (shukr)', 'Wonder and reflection'],
    adventureSlug: 'wonders-creation',
    coverImageUrl: '/paths/covers/science-nature.png',
  },
  {
    name: 'History & Civilization',
    slug: 'history-civilization',
    icon: '🏛️',
    color: '#F5A623',
    description: 'Discover great civilizations and their stories',
    mission: 'Discover how people lived, built, and shaped the world through time.',
    whatYouLearn: [
      'Great civilizations and how they rose and fell',
      'Lessons from history for today',
      'Islamic golden age contributions',
      'Critical thinking about the past',
    ],
    sampleLessons: ['Pyramids of Egypt', 'The Islamic Golden Age', 'Trade Routes Across Continents'],
    ageGroups: ['Explorer', 'Discoverer', 'Thinker'],
    islamicThemes: ['Historical consciousness', 'Justice across eras', 'Learning from the ummah\'s legacy'],
    adventureSlug: 'ancient-egypt',
    coverImageUrl: '/paths/covers/history-civilization.png',
  },
  {
    name: 'Geography & Cultures',
    slug: 'geography-cultures',
    icon: '🌍',
    color: '#2AAFA0',
    description: 'Learn about countries, cultures and people',
    mission: 'Travel the world and learn how people, places, and cultures connect.',
    whatYouLearn: [
      'Countries, continents, and landmarks',
      'How cultures celebrate and live differently',
      'Migration, trade, and global connections',
      'Respect for diversity within Islamic ethics',
    ],
    sampleLessons: ['The Great Migrations', 'Cultures Around the World', 'Maps and How We Use Them'],
    ageGroups: ['Explorer', 'Discoverer', 'Thinker'],
    islamicThemes: ['Ummah as a global community', 'Respect for peoples (shu\'ub)', 'Travel and knowledge'],
    adventureSlug: 'ancient-egypt',
    coverImageUrl: '/paths/covers/geography-cultures.png',
  },
  {
    name: 'Technology & AI',
    slug: 'technology-ai',
    icon: '🤖',
    color: '#3B82F6',
    description: 'Understand technology and use it for good',
    mission: 'Understand inventions, digital life, and how to use technology wisely.',
    whatYouLearn: [
      'How computers and the internet work',
      'Artificial intelligence basics',
      'Digital safety and screen balance',
      'Using tech to learn and serve others',
    ],
    sampleLessons: ['How the Internet Connects Us', 'What Is Artificial Intelligence?', 'Islamic Golden Age of Invention'],
    ageGroups: ['Explorer', 'Discoverer', 'Thinker'],
    islamicThemes: ['Ethical use of tools', 'Intention (niyyah) online', 'Knowledge as trust'],
    adventureSlug: 'building-character',
    coverImageUrl: '/paths/covers/technology-ai.png',
  },
  {
    name: "Today's World",
    slug: 'todays-world',
    icon: '📰',
    color: '#E85D4A',
    description: 'Understand current events and how the world works',
    mission: 'Make sense of news, current events, and the world happening now.',
    whatYouLearn: [
      'How to read news with a critical eye',
      'Understanding headlines and sources',
      'Global issues that affect families',
      'Speaking up with wisdom and kindness',
    ],
    sampleLessons: ['Understanding the News', 'Spotting Fake News', 'What Is Climate Change?'],
    ageGroups: ['Explorer', 'Discoverer', 'Thinker'],
    islamicThemes: ['Justice in public life', 'Truthfulness (sidq)', 'Community responsibility'],
    adventureSlug: 'understanding-news',
    coverImageUrl: '/paths/covers/todays-world.png',
  },
  {
    name: 'Environment & Stewardship',
    slug: 'environment-stewardship',
    icon: '🌱',
    color: '#4AAE8A',
    description: "Take care of the Earth as Allah's trustee",
    mission: "Learn to care for the Earth as a trust from Allah.",
    whatYouLearn: [
      'Climate, habitats, and biodiversity',
      'Reduce, reuse, and protect resources',
      'How small actions make a big difference',
      'Khalifah — caring for creation responsibly',
    ],
    sampleLessons: ['Signs of Allah in Nature', 'Why Bees Matter', 'Protecting Our Planet'],
    ageGroups: ['Explorer', 'Discoverer', 'Thinker'],
    islamicThemes: ['Stewardship (khalifah)', 'Balance (mizan)', 'Gratitude for provision'],
    adventureSlug: 'signs-in-nature',
    coverImageUrl: '/paths/covers/environment-stewardship.png',
  },
]

export const LEARNING_PATH_SLUGS = LEARNING_PATHS.map((p) => p.slug)

export function getLearningPathBySlug(slug: string): LearningPathDefinition | undefined {
  return LEARNING_PATHS.find((p) => p.slug === slug)
}

export function isLearningPathSlug(slug: string): slug is (typeof LEARNING_PATH_SLUGS)[number] {
  return (LEARNING_PATH_SLUGS as readonly string[]).includes(slug)
}

/** Maps dashboard category slugs to public /paths/:slug URLs */
export const CATEGORY_SLUG_TO_PUBLIC_SLUG: Record<string, string> = {
  faith: 'foundations-of-faith',
  'science-nature': 'science-nature',
  history: 'history-civilization',
  geography: 'geography-cultures',
  technology: 'technology-ai',
  'current-events': 'todays-world',
  environment: 'environment-stewardship',
}

export function resolvePublicPathSlug(adventureOrCategorySlug: string): string {
  return (
    CATEGORY_SLUG_TO_PUBLIC_SLUG[adventureOrCategorySlug] ??
    LEARNING_PATHS.find((p) => p.adventureSlug === adventureOrCategorySlug)?.slug ??
    adventureOrCategorySlug
  )
}

export function learningPathDetailUrl(adventureOrCategorySlug: string): string {
  const publicSlug = resolvePublicPathSlug(adventureOrCategorySlug)
  return `/paths/${publicSlug}`
}
