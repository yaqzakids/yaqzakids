import type { AppLanguage } from '@/i18n'
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
 */
export type DailyReminderType = 'quran_reflection' | 'sunnah'

export interface SunnahOfTheDayEntry {
  id: string
  emoji: string
  arabic: string
  transliteration: string
  titleEn: string
  titleFr: string
  titleAr: string
  hadithEn: string
  hadithFr: string
  referenceEn: string
  referenceFr: string
  actionTextEn: string
  actionTextFr: string
  actionTextAr: string
  rewardPoints: number
}

export interface SunnahDisplayContent {
  title: string
  hadithTranslation: string | null
  reference: string
  actionText: string
}

export const SUNNAH_OF_THE_DAY_ENTRIES: SunnahOfTheDayEntry[] = [
  {
    id: 'smile',
    emoji: '😊',
    arabic: 'تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ صَدَقَةٌ',
    transliteration: 'Tabassumuka fi wajhi akhika sadaqah',
    titleEn: 'Smile at Others',
    titleFr: 'Sourire aux autres',
    titleAr: 'ابتسم للآخرين',
    hadithEn: 'Your smile for your brother is charity.',
    hadithFr: 'Ton sourire envers ton frère est une aumône.',
    referenceEn: "Jami' at-Tirmidhi 1956",
    referenceFr: "Jami' at-Tirmidhi 1956",
    actionTextEn: 'Spread a smile and earn reward.',
    actionTextFr: 'Partage un sourire et gagne une récompense.',
    actionTextAr: 'ابتسم لمن حولك واكسب أجراً.',
    rewardPoints: 5,
  },
  {
    id: 'bismillah',
    emoji: '🍽️',
    arabic: 'إِذَا أَكَلَ أَحَدُكُمْ طَعَامًا فَلْيَقُلْ: بِسْمِ اللَّهِ',
    transliteration: "Idha akala ahadukum ta'aman falyaqul: Bismillah",
    titleEn: 'Say Bismillah',
    titleFr: 'Dire Bismillah',
    titleAr: 'قل بسم الله',
    hadithEn: 'When one of you eats, let him mention the name of Allah.',
    hadithFr: "Lorsque l'un de vous mange, qu'il mentionne le nom d'Allah.",
    referenceEn: 'Sunan Abu Dawud 3767',
    referenceFr: 'Sunan Abou Daoud 3767',
    actionTextEn: 'Say Bismillah before your next meal or snack.',
    actionTextFr: 'Dis Bismillah avant ton prochain repas ou goûter.',
    actionTextAr: 'قل بسم الله قبل أكلك التالي.',
    rewardPoints: 5,
  },
  {
    id: 'remove-harm',
    emoji: '🌿',
    arabic: 'وَإِزَاءَةُ الأَذَى عَنِ الطَّرِيقِ صَدَقَةٌ',
    transliteration: "Wa iza'atul-adha 'anit-tariqi sadaqah",
    titleEn: 'Remove Harm from the Path',
    titleFr: 'Enlever le danger du chemin',
    titleAr: 'أزل الأذى عن الطريق',
    hadithEn: 'Removing harmful things from the road is an act of charity.',
    hadithFr: 'Enlever ce qui nuit de la route est une aumône.',
    referenceEn: 'Sahih al-Bukhari 2980 · Sahih Muslim 2617',
    referenceFr: 'Sahih al-Boukhari 2980 · Sahih Muslim 2617',
    actionTextEn: 'Clear something unsafe or unkind from your path today.',
    actionTextFr: "Enlève aujourd'hui quelque chose de dangereux ou de nuisible sur ton chemin.",
    actionTextAr: 'أزل اليوم شيئاً قد يؤذي أحداً في طريقك.',
    rewardPoints: 5,
  },
  {
    id: 'kind-words',
    emoji: '💬',
    arabic: 'مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ',
    transliteration: "Man kana yu'minu billahi wal-yawmil-akhiri falyaqul khayran aw liyasmut",
    titleEn: 'Speak Kindly',
    titleFr: 'Parler avec bonté',
    titleAr: 'تكلم بكلام طيب',
    hadithEn:
      'Whoever believes in Allah and the Last Day should speak good or remain silent.',
    hadithFr:
      "Celui qui croit en Allah et au Jour Dernier doit dire du bien ou se taire.",
    referenceEn: 'Sahih al-Bukhari 6018 · Sahih Muslim 47',
    referenceFr: 'Sahih al-Boukhari 6018 · Sahih Muslim 47',
    actionTextEn: 'Use gentle words with someone in your family today.',
    actionTextFr: "Utilise des paroles douces avec quelqu'un de ta famille aujourd'hui.",
    actionTextAr: 'استخدم كلاماً لطيفاً مع أحد أفراد عائلتك اليوم.',
    rewardPoints: 5,
  },
  {
    id: 'help-parents',
    emoji: '🤝',
    arabic: 'رِضَا اللَّهِ فِي رِضَا الْوَالِدِ',
    transliteration: "Ridallahi fi rida al-walid",
    titleEn: 'Help Your Parents',
    titleFr: 'Aider tes parents',
    titleAr: 'ساعد والديك',
    hadithEn: 'The pleasure of the Lord lies in the pleasure of the parent.',
    hadithFr: 'La satisfaction du Seigneur est dans la satisfaction du parent.',
    referenceEn: "Jami' at-Tirmidhi 1899",
    referenceFr: "Jami' at-Tirmidhi 1899",
    actionTextEn: 'Do one helpful task for your parent without being asked.',
    actionTextFr: "Fais une tâche utile pour ton parent sans qu'on te le demande.",
    actionTextAr: 'قم بمساعدة أحد والديك دون أن يطلبوا منك.',
    rewardPoints: 5,
  },
  {
    id: 'greet-salam',
    emoji: '👋',
    arabic:
      'أَفْشُوا السَّلَامَ بَيْنَكُمْ',
    transliteration: 'Afshu as-salama baynakum',
    titleEn: 'Spread Salam',
    titleFr: 'Répandre le salam',
    titleAr: 'افشوا السلام',
    hadithEn:
      'Shall I tell you of something which, if you do it, you will love one another? Spread salam among yourselves.',
    hadithFr:
      "Vous veux-je indiquer une chose qui, si vous la faites, vous ferez que vous vous aimiez ? Répandez le salam entre vous.",
    referenceEn: 'Sahih Muslim 54',
    referenceFr: 'Sahih Muslim 54',
    actionTextEn: 'Greet a family member with a warm salam today.',
    actionTextFr: "Salue un membre de ta famille avec un salam chaleureux aujourd'hui.",
    actionTextAr: 'سلّم اليوم على أحد أفراد عائلتك بحرارة.',
    rewardPoints: 5,
  },
  {
    id: 'truthfulness',
    emoji: '✨',
    arabic:
      'عَلَيْكُمْ بِالصِّدْقِ فَإِنَّ الصِّدْقَ يَهْدِي إِلَى الْبِرِّ وَإِنَّ الْبِرَّ يَهْدِي إِلَى الْجَنَّةِ',
    transliteration: "Alaykum bis-sidqi fa innas-sidqa yahdi ilal-birri wa innal-birra yahdi ilal-jannah",
    titleEn: 'Be Truthful',
    titleFr: 'Être véridique',
    titleAr: 'كن صادقاً',
    hadithEn: 'Truthfulness leads to righteousness, and righteousness leads to Paradise.',
    hadithFr: 'La véracité mène à la piété, et la piété mène au Paradis.',
    referenceEn: 'Sahih al-Bukhari 6094 · Sahih Muslim 2607',
    referenceFr: 'Sahih al-Boukhari 6094 · Sahih Muslim 2607',
    actionTextEn: 'Practice honesty in one conversation today.',
    actionTextFr: "Pratique l'honnêteté dans une conversation aujourd'hui.",
    actionTextAr: 'تدرّب على الصدق في حديث واحد اليوم.',
    rewardPoints: 5,
  },
  {
    id: 'gratitude',
    emoji: '🙏',
    arabic: 'مَنْ لَا يَشْكُرِ النَّاسَ لَا يَشْكُرِ اللَّهَ',
    transliteration: "Man la yashkurin-nasa la yashkurillah",
    titleEn: 'Say Alhamdulillah',
    titleFr: 'Dire Alhamdulillah',
    titleAr: 'قل الحمد لله',
    hadithEn: 'He who does not thank people does not thank Allah.',
    hadithFr: "Celui qui ne remercie pas les gens ne remercie pas Allah.",
    referenceEn: "Jami' at-Tirmidhi 1954",
    referenceFr: "Jami' at-Tirmidhi 1954",
    actionTextEn: 'Thank someone and say alhamdulillah for a blessing today.',
    actionTextFr: "Remercie quelqu'un et dis alhamdulillah pour une bénédiction aujourd'hui.",
    actionTextAr: 'اشكر أحداً وقل الحمد لله على نعمة اليوم.',
    rewardPoints: 5,
  },
  {
    id: 'neighbor',
    emoji: '🏡',
    arabic: 'مَا زَالَ جِبْرِيلُ يُوصِينِي بِالْجَارِ حَتَّى ظَنَنْتُ أَنَّهُ سَيُوَرِّثُهُ',
    transliteration: "Ma zala Jibrilu yusini bil-jari hatta zanantu annahu sayuwarithuhu",
    titleEn: 'Be Good to Neighbors',
    titleFr: 'Bien traiter le voisin',
    titleAr: 'أحسن إلى الجار',
    hadithEn:
      'Jibril kept advising me about the neighbor until I thought he would make him an heir.',
    hadithFr:
      "Jibril n'a cessé de me conseiller au sujet du voisin jusqu'à ce que je pense qu'il allait le faire héritier.",
    referenceEn: 'Sahih al-Bukhari 6014 · Sahih Muslim 2624',
    referenceFr: 'Sahih al-Boukhari 6014 · Sahih Muslim 2624',
    actionTextEn: 'Do something kind for a neighbor or classmate today.',
    actionTextFr: "Fais quelque chose de gentil pour un voisin ou un camarade aujourd'hui.",
    actionTextAr: 'افعل اليوم معروفاً لجار أو زميل.',
    rewardPoints: 5,
  },
  {
    id: 'forgiveness',
    emoji: '💛',
    arabic: 'مَنْ لَا يَرْحَمْ لَا يُرْحَمْ',
    transliteration: 'Man la yarham la yurham',
    titleEn: 'Forgive Others',
    titleFr: 'Pardonner aux autres',
    titleAr: 'ارحم واغفر',
    hadithEn: 'Be merciful to others and you will receive mercy.',
    hadithFr: 'Fais miséricorde aux autres et tu recevras miséricorde.',
    referenceEn: "Jami' at-Tirmidhi 1924",
    referenceFr: "Jami' at-Tirmidhi 1924",
    actionTextEn: 'Let go of a small annoyance and respond with mercy.',
    actionTextFr: 'Laisse passer une petite contrariété et réponds avec miséricorde.',
    actionTextAr: 'تجاوز عن إزعاج بسيط واستجب بالرحمة.',
    rewardPoints: 5,
  },
  {
    id: 'cleanliness',
    emoji: '✨',
    arabic: 'الطُّهُورُ شَطْرُ الإِيمَانِ',
    transliteration: "At-tuhuru shatrul-iman",
    titleEn: 'Keep Clean',
    titleFr: 'Rester propre',
    titleAr: 'حافظ على النظافة',
    hadithEn: 'Cleanliness is half of faith.',
    hadithFr: 'La propreté est la moitié de la foi.',
    referenceEn: 'Sahih Muslim 223',
    referenceFr: 'Sahih Muslim 223',
    actionTextEn: 'Tidy your learning space or room as an act of worship.',
    actionTextFr: 'Range ton espace d’étude ou ta chambre comme un acte d’adoration.',
    actionTextAr: 'رتّب مكان دراستك أو غرفتك عبادةً.',
    rewardPoints: 5,
  },
  {
    id: 'dua-for-others',
    emoji: '🤲',
    arabic: 'دَعْوَةُ الْمُسْلِمِ لِأَخِيهِ بِظَهْرِ الْغَيْبِ مُسْتَجَابَةٌ',
    transliteration: "Da'watul-muslimi li-akhihi bizahril-ghaybi mustajabah",
    titleEn: 'Make Du’a for Someone',
    titleFr: 'Faire une du’a pour quelqu’un',
    titleAr: 'ادعُ لأخيك',
    hadithEn: 'The supplication of a Muslim for his brother in his absence is accepted.',
    hadithFr: "La supplication d'un musulman pour son frère en son absence est exaucée.",
    referenceEn: 'Sahih Muslim 2732',
    referenceFr: 'Sahih Muslim 2732',
    actionTextEn: 'Make a short du’a for a friend or family member today.',
    actionTextFr: "Fais une courte du'a pour un ami ou un membre de ta famille aujourd'hui.",
    actionTextAr: 'ادعُ اليوم لصديق أو لأحد أفراد عائلتك.',
    rewardPoints: 5,
  },
  {
    id: 'share-food',
    emoji: '🍎',
    arabic: 'لَيْسَ الْمُؤْمِنُ الَّذِي يَشْبَعُ وَجَارُهُ جَائِعٌ إِلَى جَنْبِهِ',
    transliteration: "Laysal-mu'minul-ladhi yashba'u wa jaruhu ja'i'un ila janbihi",
    titleEn: 'Share with Others',
    titleFr: 'Partager avec les autres',
    titleAr: 'شارك مع الآخرين',
    hadithEn:
      'He is not a believer whose stomach is filled while his neighbor goes hungry beside him.',
    hadithFr:
      "N'est pas croyant celui qui est rassasié pendant que son voisin a faim à côté de lui.",
    referenceEn: 'Sahih al-Bukhari 1126',
    referenceFr: 'Sahih al-Boukhari 1126',
    actionTextEn: 'Share a snack, toy, or kind moment with someone today.',
    actionTextFr: "Partage aujourd'hui un goûter, un jouet ou un moment de bonté avec quelqu'un.",
    actionTextAr: 'شارك اليوم طعاماً أو لعبة أو لطفاً مع أحدهم.',
    rewardPoints: 5,
  },
  {
    id: 'gentle-hand',
    emoji: '🕊️',
    arabic: 'إِنَّ اللَّهَ رَفِيقٌ يُحِبُّ الرِّفْقَ فِي الْأَمْرِ كُلِّهِ',
    transliteration: "Innallaha rafiqun yuhibbur-rifqa fil-amri kullihi",
    titleEn: 'Be Gentle',
    titleFr: 'Être doux',
    titleAr: 'كن رفيقاً',
    hadithEn: 'Allah is gentle and loves gentleness in all matters.',
    hadithFr: 'Allah est Doux et Il aime la douceur en toute chose.',
    referenceEn: 'Sahih al-Bukhari 6035 · Sahih Muslim 2593',
    referenceFr: 'Sahih al-Boukhari 6035 · Sahih Muslim 2593',
    actionTextEn: 'Choose a gentle voice when something feels frustrating.',
    actionTextFr: "Choisis une voix douce quand quelque chose devient frustrant.",
    actionTextAr: 'اختر اللين في كلامك عندما تشعر بالانزعاج.',
    rewardPoints: 5,
  },
]

export function getSunnahLocalized(
  entry: SunnahOfTheDayEntry,
  language: AppLanguage
): SunnahDisplayContent {
  if (language === 'fr') {
    return {
      title: entry.titleFr,
      hadithTranslation: entry.hadithFr,
      reference: entry.referenceFr,
      actionText: entry.actionTextFr,
    }
  }

  if (language === 'ar') {
    return {
      title: entry.titleAr,
      hadithTranslation: null,
      reference: entry.referenceEn,
      actionText: entry.actionTextAr,
    }
  }

  return {
    title: entry.titleEn,
    hadithTranslation: entry.hadithEn,
    reference: entry.referenceEn,
    actionText: entry.actionTextEn,
  }
}

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
