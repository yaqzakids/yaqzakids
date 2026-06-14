export const SITE_EMAILS = {
  admin: 'yaqzakids@gmail.com',
  contact: 'hello@yaqzakids.com',
} as const

export { SITE_SEO } from '@/lib/seo/siteSeo'

/** Root owner admin — always has full admin access */
export const MAIN_ADMIN_EMAIL = 'hello@yaqzakids.com'

export const COLORS = {
  bg: '#EEF4FF',
  navy: '#1B2F5E',
  teal: '#2AAFA0',
  gold: '#F5A623',
  purple: '#8B6BB1',
  coral: '#E85D4A',
  white: '#FFFFFF',
  muted: '#6B7280',
  explorer: {
    primary: '#F5A623',
    title: '#D4820A',
    age: '#E8A020',
    bg: 'linear-gradient(135deg, #FFF8E7, #FFFAEF)',
  },
  discoverer: {
    primary: '#2AAFA0',
    title: '#1A7A70',
    age: '#2AAFA0',
    bg: 'linear-gradient(135deg, #E8F8F6, #F0FDFA)',
  },
  thinker: {
    primary: '#8B6BB1',
    title: '#5B3D8A',
    age: '#8B6BB1',
    bg: 'linear-gradient(135deg, #EEF2FF, #F5F3FF)',
  },
} as const

export const IMAGES = {
  welcomeBg: 'https://i.ibb.co/YTbzfdLX/Yaffa-4.png',
  explorerCard: 'https://i.ibb.co/1fvKwtzD/Chat-GPT-Image-Jun-3-2026-07-24-06-PM.png',
  discovererCard: 'https://i.ibb.co/bMNpNMxx/Chat-GPT-Image-Jun-3-2026-07-15-02-PM.png',
  thinkerCard: 'https://i.ibb.co/Fq0z4K7V/Chat-GPT-Image-Jun-3-2026-07-20-33-PM.png',
  explorerHero: 'https://i.ibb.co/bj7FdD4Z/Chat-GPT-Image-Jun-3-2026-11-34-07-PM.png',
  discovererHero: 'https://i.ibb.co/pjFS3JM6/Chat-GPT-Image-Jun-3-2026-04-45-19-PM.png',
  thinkerHero: 'https://i.ibb.co/tTgr2xFx/Chat-GPT-Image-Jun-3-2026-04-59-24-PM.png',
  featuredStory: 'https://i.ibb.co/Z12Kh7qv/Chat-GPT-Image-Jun-4-2026-05-37-16-PM.png',
  categories: {
    amazingAnimals: 'https://i.ibb.co/HfGGfqTb/Chat-GPT-Image-Jun-4-2026-02-40-58-PM.png',
    ourWorld: 'https://i.ibb.co/Qwk4M1Q/Chat-GPT-Image-Jun-4-2026-02-40-30-PM.png',
    islamCharacter: 'https://i.ibb.co/gFRNB3Jk/Chat-GPT-Image-Jun-4-2026-02-42-51-PM.png',
    spaceAdventures: 'https://i.ibb.co/ns4zjTjM/Chat-GPT-Image-Jun-4-2026-02-44-34-PM.png',
    natureDiscoveries: 'https://i.ibb.co/8qrSkyC/Chat-GPT-Image-Jun-4-2026-02-47-03-PM.png',
    healthyHabits: 'https://i.ibb.co/Fd0pV30/Chat-GPT-Image-Jun-4-2026-02-46-59-PM.png',
    storyTime: 'https://i.ibb.co/HDhQ9Wxk/Chat-GPT-Image-Jun-4-2026-02-47-50-PM.png',
  },
} as const

export const CATEGORY_COLORS: Record<string, string> = {
  'Amazing Animals': '#FEF9C3',
  'Our World': '#DBEAFE',
  'Islam & Good Character': '#EDE9FE',
  'Space Adventures': '#DBEAFE',
  'Nature Discoveries': '#DCFCE7',
  'Healthy Habits': '#FED7AA',
  'Story Time': '#FEF9C3',
  'World News': '#DBEAFE',
  Science: '#DCFCE7',
  History: '#FEF3C7',
  Technology: '#EDE9FE',
  Environment: '#DCFCE7',
  Geography: '#FEE2E2',
}

export const EXPLORER_CATEGORIES = [
  { name: 'Amazing Animals', bg: '#FEF9C3', image: IMAGES.categories.amazingAnimals },
  { name: 'Our World', bg: '#DBEAFE', image: IMAGES.categories.ourWorld },
  { name: 'Islam & Good Character', bg: '#EDE9FE', image: IMAGES.categories.islamCharacter },
  { name: 'Space Adventures', bg: '#DBEAFE', image: IMAGES.categories.spaceAdventures },
  { name: 'Nature Discoveries', bg: '#DCFCE7', image: IMAGES.categories.natureDiscoveries },
  { name: 'Healthy Habits', bg: '#FED7AA', image: IMAGES.categories.healthyHabits },
  { name: 'Story Time', bg: '#FEF9C3', image: IMAGES.categories.storyTime },
]

export const DISCOVERER_TOPICS = [
  { name: 'World News', icon: '🌍', border: '#1B2F5E', desc: 'Current events explained for young minds.' },
  { name: 'Science', icon: '🔬', border: '#2AAFA0', desc: 'Discover how the world works through science.' },
  { name: 'History', icon: '🏛️', border: '#F5A623', desc: 'Stories from the past that shape our present.' },
  { name: 'Technology', icon: '💻', border: '#8B6BB1', desc: 'Explore innovations changing our world.' },
  { name: 'Environment', icon: '🌱', border: '#16a34a', desc: 'Learn to care for Allah\'s creation.' },
  { name: 'Geography', icon: '🗺️', border: '#E85D4A', desc: 'Travel the globe from your screen.' },
]

export const PRICING_PLANS = [
  {
    id: 'free',
    badge: 'FREE FOREVER',
    badgeColor: 'bg-teal/10 text-teal',
    name: 'Free',
    price: '$0',
    period: '',
    highlighted: false,
    borderColor: '',
    features: [
      { text: '5 articles per month', included: true },
      { text: 'All 3 languages', included: true },
      { text: 'Full archive', included: false },
      { text: 'Quizzes & activities', included: false },
      { text: 'Parent dashboard', included: false },
    ],
    buttonText: 'Get Started',
    buttonStyle: 'outline-teal',
  },
  {
    id: 'family_monthly',
    badge: 'MOST POPULAR',
    badgeColor: 'bg-gold/10 text-[#D4820A]',
    name: 'Family Monthly',
    price: '$9.99',
    period: '/month',
    highlighted: true,
    borderColor: 'border-2 border-gold',
    features: [
      { text: 'Unlimited articles', included: true },
      { text: 'All 3 languages', included: true },
      { text: 'Full archive', included: true },
      { text: 'Quizzes & activities', included: true },
      { text: 'Parent dashboard', included: true },
      { text: 'Up to 3 children', included: true },
    ],
    buttonText: 'Start Monthly',
    buttonStyle: 'gold',
  },
  {
    id: 'family_yearly',
    badge: 'BEST VALUE',
    badgeColor: 'bg-coral/10 text-coral',
    name: 'Family Yearly',
    price: '$79.99',
    period: '/year',
    save: 'Save 33%',
    highlighted: false,
    borderColor: '',
    features: [
      { text: 'Unlimited articles', included: true },
      { text: 'All 3 languages', included: true },
      { text: 'Full archive', included: true },
      { text: 'Quizzes & activities', included: true },
      { text: 'Parent dashboard', included: true },
      { text: 'Up to 3 children', included: true },
    ],
    buttonText: 'Start Yearly',
    buttonStyle: 'outline-gold',
  },
  {
    id: 'school',
    badge: 'FOR EDUCATORS',
    badgeColor: 'bg-purple/10 text-purple',
    name: 'School',
    price: '$299',
    period: '/year',
    highlighted: false,
    borderColor: '',
    features: [
      { text: 'Up to 30 students', included: true },
      { text: 'Teacher dashboard', included: true },
      { text: 'All features', included: true },
    ],
    buttonText: 'Contact Us',
    buttonStyle: 'outline-purple',
  },
]

export const XP_REWARDS: Record<string, number> = {
  explorer: 10,
  discoverer: 25,
  thinker: 50,
}

export const LEVEL_XP_THRESHOLD = 100

export const STORAGE_KEYS = {
  ageGroup: 'yaqza_age_group',
  language: 'yaqza_language',
} as const
