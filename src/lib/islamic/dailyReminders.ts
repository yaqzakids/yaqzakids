import {
  DUA_ROTATION,
  getDailyDuaForDate,
  getReminderHeading,
  getReminderScheduleLabel,
  type DailyDuaEntry,
} from '@/lib/parent/dailyDuaContent'

/**
 * Future-ready model for admin-managed reminders.
 * TODO: Replace static arrays with Supabase `daily_reminders` when the table exists.
 *
 * daily_reminders:
 * - id, type: quran_reflection | sunnah, title, arabic_text, transliteration,
 *   translation, reference, reflection, family_discussion, action_text,
 *   reward_points, date, active
 */
export type DailyReminderType = 'quran_reflection' | 'sunnah'

export interface DailyReminderRecord {
  id: string
  type: DailyReminderType
  title: string
  arabic_text?: string | null
  transliteration?: string | null
  translation?: string | null
  reference?: string | null
  reflection?: string | null
  family_discussion?: string | null
  action_text?: string | null
  reward_points?: number | null
  date?: string | null
  active?: boolean
  hadith?: string | null
  emoji?: string | null
}

export interface SunnahOfTheDayEntry {
  id: string
  title: string
  emoji: string
  hadith: string
  reference: string
  actionText: string
  rewardPoints: number
}

export const SUNNAH_OF_THE_DAY_ENTRIES: SunnahOfTheDayEntry[] = [
  {
    id: 'smile',
    title: 'Smile at Others',
    emoji: '😊',
    hadith: 'Your smile for your brother is charity.',
    reference: 'Tirmidhi',
    actionText: 'Spread a smile and earn reward.',
    rewardPoints: 5,
  },
  {
    id: 'bismillah',
    title: 'Say Bismillah',
    emoji: '🍽️',
    hadith: 'When one of you eats, let him mention the name of Allah.',
    reference: 'Abu Dawud',
    actionText: 'Say Bismillah before your next meal or snack.',
    rewardPoints: 5,
  },
  {
    id: 'remove-harm',
    title: 'Remove Harm from the Path',
    emoji: '🌿',
    hadith: 'Removing harmful things from the road is an act of charity.',
    reference: 'Bukhari & Muslim',
    actionText: 'Clear something unsafe or unkind from your path today.',
    rewardPoints: 5,
  },
  {
    id: 'kind-words',
    title: 'Speak Kindly',
    emoji: '💬',
    hadith: 'Whoever believes in Allah and the Last Day should speak good or remain silent.',
    reference: 'Bukhari & Muslim',
    actionText: 'Use gentle words with someone in your family today.',
    rewardPoints: 5,
  },
  {
    id: 'help-parents',
    title: 'Help Your Parents',
    emoji: '🤝',
    hadith: 'The pleasure of the Lord lies in the pleasure of the parent.',
    reference: 'Tirmidhi',
    actionText: 'Do one helpful task for your parent without being asked.',
    rewardPoints: 5,
  },
  {
    id: 'greet-salam',
    title: 'Spread Salam',
    emoji: '👋',
    hadith: 'You will not enter Paradise until you believe, and you will not believe until you love one another. Shall I tell you of something which, if you do it, you will love one another? Spread salam among yourselves.',
    reference: 'Muslim',
    actionText: 'Greet a family member with a warm salam today.',
    rewardPoints: 5,
  },
  {
    id: 'truthfulness',
    title: 'Be Truthful',
    emoji: '✨',
    hadith: 'Truthfulness leads to righteousness, and righteousness leads to Paradise.',
    reference: 'Bukhari & Muslim',
    actionText: 'Practice honesty in one conversation today.',
    rewardPoints: 5,
  },
  {
    id: 'gratitude',
    title: 'Say Alhamdulillah',
    emoji: '🙏',
    hadith: 'He who does not thank people does not thank Allah.',
    reference: 'Tirmidhi',
    actionText: 'Thank someone and say alhamdulillah for a blessing today.',
    rewardPoints: 5,
  },
  {
    id: 'neighbor',
    title: 'Be Good to Neighbors',
    emoji: '🏡',
    hadith: 'Jibril kept advising me about the neighbor until I thought he would make him an heir.',
    reference: 'Bukhari & Muslim',
    actionText: 'Do something kind for a neighbor or classmate today.',
    rewardPoints: 5,
  },
  {
    id: 'forgiveness',
    title: 'Forgive Others',
    emoji: '💛',
    hadith: 'Be merciful to others and you will receive mercy.',
    reference: 'Tirmidhi',
    actionText: 'Let go of a small annoyance and respond with mercy.',
    rewardPoints: 5,
  },
  {
    id: 'cleanliness',
    title: 'Keep Clean',
    emoji: '✨',
    hadith: 'Cleanliness is half of faith.',
    reference: 'Muslim',
    actionText: 'Tidy your learning space or room as an act of worship.',
    rewardPoints: 5,
  },
  {
    id: 'dua-for-others',
    title: 'Make Du’a for Someone',
    emoji: '🤲',
    hadith: 'The du’a of a Muslim for his brother in his absence is accepted.',
    reference: 'Muslim',
    actionText: 'Make a short du’a for a friend or family member today.',
    rewardPoints: 5,
  },
  {
    id: 'share-food',
    title: 'Share with Others',
    emoji: '🍎',
    hadith: 'He is not a believer whose stomach is filled while his neighbor goes hungry.',
    reference: 'Tabarani',
    actionText: 'Share a snack, toy, or kind moment with someone today.',
    rewardPoints: 5,
  },
  {
    id: 'gentle-hand',
    title: 'Be Gentle',
    emoji: '🕊️',
    hadith: 'Allah is gentle and loves gentleness in all matters.',
    reference: 'Bukhari & Muslim',
    actionText: 'Choose a gentle voice when something feels frustrating.',
    rewardPoints: 5,
  },
]

function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0)
  return Math.floor((date.getTime() - start.getTime()) / 86_400_000)
}

function rotationIndex(date: Date): number {
  const day = dayOfYear(date)
  return DUA_ROTATION === 'weekly' ? Math.floor(day / 7) : day
}

export function getSunnahForDate(date = new Date()): SunnahOfTheDayEntry {
  const index = rotationIndex(date)
  return SUNNAH_OF_THE_DAY_ENTRIES[index % SUNNAH_OF_THE_DAY_ENTRIES.length]
}

export function getQuranReflectionForDate(date = new Date()): DailyDuaEntry {
  return getDailyDuaForDate(date, DUA_ROTATION)
}

export function getQuranReminderHeading(date = new Date()): string {
  return getReminderHeading(date, DUA_ROTATION)
}

export function getQuranScheduleLabel(date = new Date()): string {
  return getReminderScheduleLabel(date, DUA_ROTATION)
}

export function dateKey(date = new Date()): string {
  return date.toISOString().slice(0, 10)
}
