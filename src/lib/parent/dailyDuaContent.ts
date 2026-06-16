export interface DailyDuaEntry {
  id: string
  arabic: string
  transliteration: string
  translationEn: string
  translationFr: string
  source: string
  reflection: string
  discussionQuestion: string
  quranVerse?: {
    arabic: string
    translation: string
    reference: string
  }
}

export const DAILY_DUA_ENTRIES: DailyDuaEntry[] = [
  {
    id: 'increase-knowledge',
    arabic: 'رَبِّ زِدْنِي عِلْمًا',
    transliteration: 'Rabbi zidni ilma',
    translationEn: 'My Lord, increase me in knowledge.',
    translationFr: 'Seigneur, accrois mes connaissances.',
    source: "Qur'an 20:114",
    reflection: 'Learning is an act of worship when done with sincerity.',
    discussionQuestion: 'What is one thing you learned today that made you grateful to Allah?',
    quranVerse: {
      arabic: 'رَبِّ زِدْنِي عِلْمًا',
      translation: 'My Lord, increase me in knowledge.',
      reference: "Qur'an 20:114",
    },
  },
  {
    id: 'guidance',
    arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً',
    transliteration: 'Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanah',
    translationEn: 'Our Lord, give us good in this world and good in the Hereafter.',
    translationFr: 'Notre Seigneur, accorde-nous le bien ici-bas et le bien dans l\'au-delà.',
    source: "Qur'an 2:201",
    reflection: 'We ask Allah for balance — success in this life and the next.',
    discussionQuestion: 'What good deed did you do today that you hope Allah accepts?',
  },
  {
    id: 'patience',
    arabic: 'رَبَّنَا أَفْرِغْ عَلَيْنَا صَبْرًا',
    transliteration: 'Rabbana afrigh alayna sabran',
    translationEn: 'Our Lord, pour upon us patience.',
    translationFr: 'Notre Seigneur, déverse sur nous la patience.',
    source: "Qur'an 2:250",
    reflection: 'Patience helps us stay strong when learning gets hard.',
    discussionQuestion: 'When was a time you showed patience while learning something new?',
  },
]

export function getDailyDuaForDate(date = new Date()): DailyDuaEntry {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86_400_000
  )
  return DAILY_DUA_ENTRIES[dayOfYear % DAILY_DUA_ENTRIES.length]
}

export const USUL_THEMES = [
  { id: 'tawhid', label: 'Tawhid', icon: '☪️', color: '#2AAFA0' },
  { id: 'knowledge', label: 'Knowledge', icon: '📚', color: '#8B6BB1' },
  { id: 'justice', label: 'Justice', icon: '⚖️', color: '#1B2F5E' },
  { id: 'stewardship', label: 'Stewardship', icon: '🌱', color: '#4AAE8A' },
  { id: 'purpose', label: 'Purpose', icon: '🎯', color: '#F5A623' },
  { id: 'akhlaq', label: 'Akhlaq', icon: '💎', color: '#E85D4A' },
  { id: 'revelation', label: 'Revelation', icon: '📖', color: '#243B6E' },
  { id: 'akhirah', label: 'Akhirah', icon: '🌙', color: '#6B7280' },
] as const
