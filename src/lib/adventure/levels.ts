/** Star-based level progression (UI shows Stars, DB stores points) */
export const STAR_LEVELS = [
  { name: 'Seeker', min: 0 },
  { name: 'Curious', min: 100 },
  { name: 'Explorer', min: 250 },
  { name: 'Discoverer', min: 500 },
  { name: 'Investigator', min: 1000 },
  { name: 'Thinker', min: 2000 },
  { name: 'Analyst', min: 3500 },
  { name: 'Scholar', min: 5000 },
  { name: 'Visionary', min: 8000 },
  { name: 'Leader', min: 12000 },
] as const

export function getLevelProgress(totalStars: number) {
  let currentIndex = 0
  for (let i = 0; i < STAR_LEVELS.length; i++) {
    if (totalStars >= STAR_LEVELS[i].min) currentIndex = i
  }
  const current = STAR_LEVELS[currentIndex]
  const next = STAR_LEVELS[currentIndex + 1] ?? null
  if (!next) {
    return {
      currentLevel: current.name,
      nextLevel: null,
      starsToNext: 0,
      progressPercent: 100,
    }
  }
  const range = next.min - current.min
  const earned = totalStars - current.min
  return {
    currentLevel: current.name,
    nextLevel: next.name,
    starsToNext: next.min - totalStars,
    progressPercent: Math.min(100, Math.round((earned / range) * 100)),
  }
}
