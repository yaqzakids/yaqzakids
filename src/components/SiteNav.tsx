import Navbar from './layout/Navbar'
import PublicNav from './layout/PublicNav'

export type SiteNavVariant = 'explorer' | 'discoverer' | 'thinker' | 'light'

export function SiteNav({
  variant,
  forcePublic = false,
}: {
  variant: SiteNavVariant
  forcePublic?: boolean
}) {
  if (forcePublic) {
    return <PublicNav />
  }

  const navVariant: 'explorer' | 'discoverer' | 'thinker' =
    variant === 'light' ? 'thinker' : variant
  return <Navbar variant={navVariant} forcePublic={forcePublic} />
}
