export const GAMES = [
  {
    name: 'Daily Challenge',
    slug: 'daily-challenge',
    icon: '⭐',
    description: 'One question a day. Can you answer it?',
  },
  {
    name: 'Quiz Battle',
    slug: 'quiz-battle',
    icon: '⚡',
    description: 'Answer fast. Earn more stars.',
  },
  {
    name: 'Word Explorer',
    slug: 'word-explorer',
    icon: '🔤',
    description: 'Find hidden Islamic words.',
  },
  {
    name: 'Story Builder',
    slug: 'story-builder',
    icon: '📖',
    description: 'Put the story in the right order.',
  },
  {
    name: 'Knowledge Map',
    slug: 'knowledge-map',
    icon: '🗺️',
    description: 'Explore Islamic civilization on a world map.',
  },
  {
    name: 'Hero Match',
    slug: 'hero-match',
    icon: '🃏',
    description: 'Match the hero to their trait.',
  },
] as const

export type GameSlug = (typeof GAMES)[number]['slug']

export function gameBySlug(slug: string) {
  return GAMES.find((g) => g.slug === slug)
}
