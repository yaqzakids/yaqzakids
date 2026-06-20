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

/** How often the featured du'a rotates. Set to `weekly` for a new reminder each week. */
export const DUA_ROTATION: 'daily' | 'weekly' = 'daily'

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
  },
  {
    id: 'guidance',
    arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً',
    transliteration: 'Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanah',
    translationEn: 'Our Lord, give us good in this world and good in the Hereafter.',
    translationFr: "Notre Seigneur, accorde-nous le bien ici-bas et le bien dans l'au-delà.",
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
  {
    id: 'ease-after-hardship',
    arabic: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا',
    transliteration: "Fa inna ma'al 'usri yusra",
    translationEn: 'Indeed, with hardship comes ease.',
    translationFr: "En vérité, avec la difficulté vient la facilité.",
    source: "Qur'an 94:6",
    reflection: 'Allah promises that difficulty is never the end of the story.',
    discussionQuestion: 'Can you remember a hard moment that later became easier?',
  },
  {
    id: 'expand-chest',
    arabic: 'رَبِّ اشْرَحْ لِي صَدْرِي',
    transliteration: 'Rabbi ishrah li sadri',
    translationEn: 'My Lord, expand for me my chest.',
    translationFr: 'Seigneur, ouvre-moi ma poitrine.',
    source: "Qur'an 20:25",
    reflection: 'We ask Allah for calm hearts when we feel nervous or stuck.',
    discussionQuestion: 'What helps you feel calm before trying something difficult?',
  },
  {
    id: 'hasbunallah',
    arabic: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ',
    transliteration: "Hasbunallahu wa ni'mal wakeel",
    translationEn: 'Allah is sufficient for us, and He is the best Disposer of affairs.',
    translationFr: 'Allah nous suffit, et Il est le meilleur Protecteur.',
    source: "Qur'an 3:173",
    reflection: 'Trusting Allah helps us face challenges with courage.',
    discussionQuestion: 'When did trusting Allah help you feel braver?',
  },
  {
    id: 'steady-hearts',
    arabic: 'رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا',
    transliteration: 'Rabbana la tuzigh qulubana ba\'da idh hadaytana',
    translationEn: 'Our Lord, do not let our hearts deviate after You have guided us.',
    translationFr: 'Notre Seigneur, ne fais pas dévier nos cœurs après nous avoir guidés.',
    source: "Qur'an 3:8",
    reflection: 'Guidance is a gift we ask Allah to keep firm in our hearts.',
    discussionQuestion: 'What habit helps you stay on the right path each day?',
  },
  {
    id: 'grateful-blessings',
    arabic: 'وَأَمَّا بِنِعْمَةِ رَبِّكَ فَحَدِّثْ',
    transliteration: "Wa amma bi ni'mati rabbika fahaddith",
    translationEn: 'And as for the favor of your Lord, proclaim it.',
    translationFr: 'Et quant au bienfait de ton Seigneur, proclame-le.',
    source: "Qur'an 93:11",
    reflection: 'Speaking about Allah’s blessings helps us notice them more.',
    discussionQuestion: 'What blessing from Allah will you share with your family today?',
  },
  {
    id: 'need-allahs-good',
    arabic: 'رَبِّ إِنِّي لِمَا أَنْزَلْتَ إِلَيَّ مِنْ خَيْرٍ فَقِيرٌ',
    transliteration: 'Rabbi inni lima anzalta ilayya min khayrin faqir',
    translationEn: 'My Lord, I am in need of whatever good You send down to me.',
    translationFr: "Seigneur, j'ai besoin de tout bien que Tu fais descendre vers moi.",
    source: "Qur'an 28:24",
    reflection: 'Every good thing we receive comes from Allah.',
    discussionQuestion: 'What good thing did Allah send your way recently?',
  },
  {
    id: 'establish-prayer',
    arabic: 'رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِنْ ذُرِّيَّتِي',
    transliteration: "Rabbij'alni muqimas salati wa min dhurriyyati",
    translationEn: 'My Lord, make me an establisher of prayer, and from my descendants.',
    translationFr: 'Seigneur, fais de moi quelqu’un qui accomplit la prière, ainsi que ma descendance.',
    source: "Qur'an 14:40",
    reflection: 'Prayer keeps our day connected to Allah.',
    discussionQuestion: 'How does prayer help you pause and refocus during a busy day?',
  },
  {
    id: 'righteous-family',
    arabic: 'رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ',
    transliteration: 'Rabbana hab lana min azwajina wa dhurriyyatina qurrata a\'yun',
    translationEn: 'Our Lord, grant us comfort from our spouses and offspring.',
    translationFr: 'Notre Seigneur, accorde-nous la joie de nos épouses et de nos enfants.',
    source: "Qur'an 25:74",
    reflection: 'Family is a mercy — we ask Allah to make our homes full of joy.',
    discussionQuestion: 'What is one way you brought joy to someone in your family today?',
  },
  {
    id: 'forgiveness',
    arabic: 'رَبَّنَا اغْفِرْ لَنَا ذُنُوبَنَا',
    transliteration: 'Rabbanaghfir lana dhunubana',
    translationEn: 'Our Lord, forgive us our sins.',
    translationFr: 'Notre Seigneur, pardonne-nous nos péchés.',
    source: "Qur'an 3:147",
    reflection: 'Asking forgiveness keeps our hearts light and humble.',
    discussionQuestion: 'Why is saying sorry and seeking forgiveness important in a family?',
  },
  {
    id: 'seek-help-patience',
    arabic: 'يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ',
    transliteration: "Ya ayyuhalladhina amanusta'inu bis-sabri was-salah",
    translationEn: 'O you who believe, seek help through patience and prayer.',
    translationFr: 'Ô vous qui croyez, cherchez secours dans la patience et la prière.',
    source: "Qur'an 2:153",
    reflection: 'Patience and prayer are tools Allah gave us for hard days.',
    discussionQuestion: 'What can you do when you feel frustrated while learning?',
  },
  {
    id: 'parents-forgiveness',
    arabic: 'رَبِّ اغْفِرْ لِي وَلِوَالِدَيَّ',
    transliteration: 'Rabbighfir li wa liwalidayya',
    translationEn: 'My Lord, forgive me and my parents.',
    translationFr: 'Seigneur, pardonne-moi ainsi qu’à mes parents.',
    source: "Qur'an 71:28",
    reflection: 'Honouring parents includes praying for them.',
    discussionQuestion: 'What is one kind thing you can do for your parents today?',
  },
  {
    id: 'truthful-entry',
    arabic: 'رَبِّ أَدْخِلْنِي مُدْخَلَ صِدْقٍ وَأَخْرِجْنِي مُخْرَجَ صِدْقٍ',
    transliteration: 'Rabbi adkhilni mudkhala sidqin wa akhrijni mukhraja sidq',
    translationEn: 'My Lord, cause me to enter a sound entrance and to exit a sound exit.',
    translationFr: 'Seigneur, fais-moi entrer par une entrée de vérité et sortir par une sortie de vérité.',
    source: "Qur'an 17:80",
    reflection: 'We ask Allah to bless the beginning and end of everything we do.',
    discussionQuestion: 'How do you try to begin your schoolwork or reading with sincerity?',
  },
  {
    id: 'success-from-allah',
    arabic: 'وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ',
    transliteration: 'Wa ma tawfiqi illa billah',
    translationEn: 'My success is only through Allah.',
    translationFr: 'Ma réussite ne vient que d’Allah.',
    source: "Qur'an 11:88",
    reflection: 'Real success comes when we rely on Allah, not only on ourselves.',
    discussionQuestion: 'What does success mean to you as a learner and as a Muslim?',
  },
  {
    id: 'repentance-yunus',
    arabic: 'لَا إِلَٰهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ',
    transliteration: "La ilaha illa anta subhanaka inni kuntu minadh-dhalimin",
    translationEn: 'There is no god but You; glory be to You. Indeed, I have been among the wrongdoers.',
    translationFr: "Il n'y a de divinité que Toi ! Gloire à Toi ! J'ai été du nombre des injustes.",
    source: "Qur'an 21:87",
    reflection: 'This du’a of Yunus (AS) teaches us to turn back to Allah with honesty.',
    discussionQuestion: 'Why is it brave to admit our mistakes and ask Allah for help?',
  },
  {
    id: 'accept-deeds',
    arabic: 'رَبَّنَا تَقَبَّلْ مِنَّا',
    transliteration: 'Rabbana taqabbal minna',
    translationEn: 'Our Lord, accept from us.',
    translationFr: 'Notre Seigneur, accepte de nous.',
    source: "Qur'an 2:127",
    reflection: 'We do our best, then ask Allah to accept our efforts.',
    discussionQuestion: 'What effort did you make today that you hope Allah accepts?',
  },
  {
    id: 'grateful-thanks',
    arabic: 'الْحَمْدُ لِلَّهِ الَّذِي هَدَانَا لِهَٰذَا',
    transliteration: 'Alhamdu lillahil-ladhi hadana lihadha',
    translationEn: 'Praise be to Allah who guided us to this.',
    translationFr: 'Louange à Allah qui nous a guidés vers cela.',
    source: "Qur'an 7:43",
    reflection: 'Gratitude turns ordinary moments into worship.',
    discussionQuestion: 'What are three things you are thankful for today?',
  },
  {
    id: 'righteous-offspring',
    arabic: 'رَبِّ هَبْ لِي مِنْ لَدُنْكَ ذُرِّيَّةً طَيِّبَةً',
    transliteration: 'Rabbi hab li min ladunka dhurriyyatan tayyibah',
    translationEn: 'My Lord, grant me from Yourself righteous offspring.',
    translationFr: 'Seigneur, accorde-moi de Ta part une descendance pieuse.',
    source: "Qur'an 3:38",
    reflection: 'Parents and children both grow in faith together.',
    discussionQuestion: 'What quality would you like to grow in yourself this week?',
  },
  {
    id: 'light-upon-light',
    arabic: 'اللَّهُمَّ اجْعَلْ فِي قَلْبِي نُورًا',
    transliteration: 'Allahumma ij\'al fi qalbi nuran',
    translationEn: 'O Allah, place light in my heart.',
    translationFr: 'Ô Allah, mets de la lumière dans mon cœur.',
    source: 'Prophetic du’a',
    reflection: 'We ask Allah for inner light to understand what is right.',
    discussionQuestion: 'What helps your heart feel peaceful and full of light?',
    quranVerse: {
      arabic: 'اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ',
      translation: 'Allah is the Light of the heavens and the earth.',
      reference: "Qur'an 24:35",
    },
  },
  {
    id: 'morning-protection',
    arabic: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ',
    transliteration: 'Asbahna wa asbahal-mulku lillah',
    translationEn: 'We have entered a new morning and all dominion belongs to Allah.',
    translationFr: 'Nous voici au matin et la royauté appartient à Allah.',
    source: 'Morning remembrance',
    reflection: 'Starting the day by remembering Allah sets a beautiful tone.',
    discussionQuestion: 'What is one good intention you have for today?',
  },
  {
    id: 'trust-allah-plan',
    arabic: 'وَمَنْ يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ',
    transliteration: "Wa man yatawakkal 'alallahi fahuwa hasbuh",
    translationEn: 'Whoever relies upon Allah — then He is sufficient for him.',
    translationFr: 'Quiconque place sa confiance en Allah, Il lui suffit.',
    source: "Qur'an 65:3",
    reflection: 'Tawakkul means we try our best and trust Allah with the result.',
    discussionQuestion: 'When have you tried your best and left the rest to Allah?',
  },
  {
    id: 'speak-kindness',
    arabic: 'وَقُولُوا لِلنَّاسِ حُسْنًا',
    transliteration: 'Wa qulu lin-nasi husna',
    translationEn: 'And speak to people good words.',
    translationFr: 'Et dites aux gens de belles paroles.',
    source: "Qur'an 2:83",
    reflection: 'Kind words are a simple way to live our faith every day.',
    discussionQuestion: 'What kind words can you say to someone in your family today?',
  },
  {
    id: 'remember-allah-hearts',
    arabic: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    transliteration: "Ala bidhikrillahi tatma'innul-qulub",
    translationEn: 'Verily, in the remembrance of Allah hearts find rest.',
    translationFr: 'C\'est par le rappel d\'Allah que les cœurs se tranquillisent.',
    source: "Qur'an 13:28",
    reflection: 'Remembering Allah brings peace when our minds feel busy.',
    discussionQuestion: 'What dhikr or short phrase helps you feel calm?',
  },
  {
    id: 'do-good-consistently',
    arabic: 'إِنَّ الَّذِينَ قَالُوا رَبُّنَا اللَّهُ ثُمَّ اسْتَقَامُوا',
    transliteration: "Innalladhina qalu rabbunallahu thummastaqamu",
    translationEn: 'Indeed, those who say, "Our Lord is Allah," and then remain steadfast.',
    translationFr: 'Ceux qui disent : « Notre Seigneur est Allah », puis demeurent constants.',
    source: "Qur'an 41:30",
    reflection: 'Small steady good deeds matter more than occasional big ones.',
    discussionQuestion: 'What is one small good deed you can keep doing every day?',
  },
  {
    id: 'mercy-compassion',
    arabic: 'رَبَّنَا لَا تُؤَاخِذْنَا إِنْ نَسِينَا أَوْ أَخْطَأْنَا',
    transliteration: 'Rabbana la tu\'akhidhna in nasina aw akhta\'na',
    translationEn: 'Our Lord, do not impose blame upon us if we forget or make mistakes.',
    translationFr: 'Notre Seigneur, ne nous punis pas si nous oublions ou commettons une erreur.',
    source: "Qur'an 2:286",
    reflection: 'Allah is merciful when we forget or slip — we can ask Him gently.',
    discussionQuestion: 'How can we show mercy to others when they make mistakes?',
  },
  {
    id: 'gratitude-worship',
    arabic: 'لَئِنْ شَكَرْتُمْ لَأَزِيدَنَّكُمْ',
    transliteration: "La'in shakartum la'azidannakum",
    translationEn: 'If you are grateful, I will surely increase you.',
    translationFr: 'Si vous êtes reconnaissants, J\'augmenterai pour vous.',
    source: "Qur'an 14:7",
    reflection: 'Gratitude opens the door to more blessings.',
    discussionQuestion: 'How can you show gratitude to Allah and to the people around you?',
  },
]

function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0)
  return Math.floor((date.getTime() - start.getTime()) / 86_400_000)
}

function rotationIndex(date: Date, rotation: 'daily' | 'weekly'): number {
  const day = dayOfYear(date)
  return rotation === 'weekly' ? Math.floor(day / 7) : day
}

export function getDailyDuaForDate(
  date = new Date(),
  rotation: 'daily' | 'weekly' = DUA_ROTATION
): DailyDuaEntry {
  const index = rotationIndex(date, rotation)
  return DAILY_DUA_ENTRIES[index % DAILY_DUA_ENTRIES.length]
}

export function getReminderHeading(
  _date = new Date(),
  rotation: 'daily' | 'weekly' = DUA_ROTATION
): string {
  return rotation === 'weekly' ? "This Week's Reminder" : "Today's Reminder"
}

export function getReminderScheduleLabel(
  date = new Date(),
  rotation: 'daily' | 'weekly' = DUA_ROTATION
): string {
  if (rotation === 'weekly') {
    const weekIndex = rotationIndex(date, 'weekly')
    const yearStart = new Date(date.getFullYear(), 0, 1)
    const weekStart = new Date(yearStart)
    weekStart.setDate(yearStart.getDate() + weekIndex * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    const fmt: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
    return `New reminder each week · ${weekStart.toLocaleDateString(undefined, fmt)} – ${weekEnd.toLocaleDateString(undefined, fmt)}`
  }

  return `New reminder each day · ${date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })}`
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
