import type { AgeHomepageConfig } from '@/components/AgeHomepage'
import { IMAGES } from '@/lib/images'

export const explorerHomepageConfig: AgeHomepageConfig = {
  variant: 'explorer',
  pageBg: 'bg-cream',
  heroBg: 'https://i.ibb.co/bj7FdD4Z/Chat-GPT-Image-Jun-3-2026-11-34-07-PM.png',
  heroOverlay: 'linear-gradient(to right, rgba(255,251,240,0.97) 0%, rgba(255,251,240,0.92) 40%, transparent 100%)',
  pillText: '🌟 Stories • Activities • Faith • Fun',
  headlineParts: [
    { text: 'Learn About', color: 'text-navy' },
    { text: 'Your Amazing', color: 'text-gold' },
    { text: 'World! 🚀', color: 'text-navy' },
  ],
  subtitle: 'Super fun stories about science, animals, news and Islam — just for you! Earn stars and badges as you learn!',
  primaryCta: { label: '⭐ Start My Adventure!', cls: 'bg-gold text-white hover:bg-gold-dark' },
  secondaryCta: { label: 'Watch a Story', cls: 'border-2 border-gold text-gold-dark hover:bg-gold hover:text-white' },
  trustText: '🎯 Easy to Read · 🎨 Fun Activities · 🏆 Earn Badges · ☪️ Islamic Values',
  features: [
    { icon: '📖', title: 'Short fun stories' },
    { icon: '🎨', title: 'Drawing & colouring activities' },
    { icon: '⭐', title: 'Earn gold stars' },
    { icon: '☪️', title: 'Islamic lessons' },
  ],
  storiesLabel: "Today's Adventures",
  storiesHeadline: 'What shall we learn today? 🌟',
  storyXp: '+10 XP',
  storyMeta: 'Easy · 3 min',
}

export const discovererHomepageConfig: AgeHomepageConfig = {
  variant: 'discoverer',
  heroBg: IMAGES.discovererHero,
  heroOverlay: 'linear-gradient(to right, rgba(238,244,255,0.97) 0%, rgba(238,244,255,0.92) 40%, transparent 100%)',
  pillText: '🌍 Daily News • Science • Discovery • Faith',
  headlineParts: [
    { text: 'Raise Curious,', color: 'text-navy' },
    { text: 'Confident', color: 'text-teal' },
    { text: 'Muslim Children', color: 'text-navy' },
  ],
  subtitle: 'Daily news, science, technology and positive stories adapted for ages 9–12 and connected to Islamic values.',
  primaryCta: { label: '📖 Start Reading Free →', cls: 'bg-gold text-white hover:opacity-90' },
  secondaryCta: { label: "Explore Today's Stories", cls: 'border-2 border-navy text-navy bg-transparent hover:bg-navy/5' },
  trustText: '👤 Ages 9–12 · 🌍 EN•FR•AR · 🛡️ Safe & Ad-Free · 👨‍👩‍👧 Family Plans',
  features: [
    { icon: '🛡️', title: 'Safe & Ad-Free' },
    { icon: '☪️', title: 'Islamic Values' },
    { icon: '👨‍👩‍👧', title: 'Parent Dashboard' },
    { icon: '🏆', title: 'Earn Rewards' },
  ],
  storiesLabel: "TODAY'S TOP STORIES",
  storiesHeadline: 'Stories that make you think, wonder and grow',
  storyXp: '+25 XP',
  storyMeta: '⏱ 5 min read',
}

export const thinkerHomepageConfig: AgeHomepageConfig = {
  variant: 'thinker',
  pageBg: 'bg-navy',
  heroBg: IMAGES.thinkerHero,
  heroOverlay: 'linear-gradient(to right, rgba(27,47,94,0.97) 0%, rgba(27,47,94,0.92) 40%, transparent 100%)',
  pillText: '🌍 Analysis • Perspective • Critical Thinking',
  headlineParts: [
    { text: 'Think Deeper.', color: 'text-white' },
    { text: 'Question More.', color: 'text-teal' },
    { text: 'Grow Stronger.', color: 'text-gold' },
  ],
  subtitle: 'In-depth analysis of world events, science, technology and Islamic civilization — built for sharp minds ages 13–16.',
  subtitleColor: 'text-white/75',
  primaryCta: { label: '📖 Start Reading Free →', cls: 'bg-gold text-navy hover:opacity-90' },
  secondaryCta: { label: 'Explore Topics', cls: 'border-2 border-white text-white bg-transparent hover:bg-white/10' },
  trustText: '👤 Ages 13–16 · 🌍 EN•FR•AR · 🛡️ Safe & Ad-Free · 🏆 XP & Achievements',
  features: [
    { icon: '🧠', title: 'Critical Thinking' },
    { icon: '☪️', title: 'Islamic Values' },
    { icon: '📊', title: 'In-depth Analysis' },
    { icon: '🏆', title: 'Earn Achievements' },
  ],
  storiesLabel: "TODAY'S ANALYSIS",
  storiesHeadline: 'Deep dives for curious minds',
  storiesBg: 'bg-[#243B6E]',
  storyCardCls: 'bg-[#243B6E] border border-white/10',
  storyXp: '+50 XP',
  storyMeta: '⏱ 8 min read',
  sectionLabelCls: 'text-gold',
  sectionHeadlineCls: 'text-white',
  featureStripCls: 'bg-[#243B6E] text-white',
}
