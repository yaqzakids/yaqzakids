import { AgeHomepage } from '@/components/AgeHomepage'

export default function Explorer() {
  return (
    <div className="page-transition">
      <AgeHomepage
        variant="explorer"
        pageBg="bg-cream"
        heroBg="https://i.ibb.co/bj7FdD4Z/Chat-GPT-Image-Jun-3-2026-11-34-07-PM.png"
        heroOverlay="linear-gradient(to right, rgba(255,251,240,0.97) 0%, rgba(255,251,240,0.92) 40%, transparent 100%)"
        pillText="🌟 Stories • Activities • Faith • Fun"
        headlineParts={[
          { text: 'Learn About', color: 'text-navy' },
          { text: 'Your Amazing', color: 'text-gold' },
          { text: 'World! 🚀', color: 'text-navy' },
        ]}
        subtitle="Super fun stories about science, animals, news and Islam — just for you! Earn stars and badges as you learn!"
        primaryCta={{ label: '⭐ Start My Adventure!', cls: 'bg-gold text-white hover:bg-gold-dark' }}
        secondaryCta={{ label: 'Watch a Story', cls: 'border-2 border-gold text-gold-dark hover:bg-gold hover:text-white' }}
        trustText="🎯 Easy to Read · 🎨 Fun Activities · 🏆 Earn Badges · ☪️ Islamic Values"
        features={[
          { icon: '📖', title: 'Short fun stories' },
          { icon: '🎨', title: 'Drawing activities' },
          { icon: '⭐', title: 'Earn gold stars' },
          { icon: '☪️', title: 'Islamic lessons' },
        ]}
        storiesLabel="Today's Adventures"
        storiesHeadline="What shall we learn today? 🌟"
        storyXp="+10 XP"
        storyMeta="Easy · 3 min"
      />
    </div>
  )
}
