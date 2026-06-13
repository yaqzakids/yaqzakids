import Navbar from './layout/Navbar'

export type SiteNavVariant = 'explorer' | 'discoverer' | 'thinker' | 'light'

export function SiteNav({ variant }: { variant: SiteNavVariant }) {
  const navVariant: 'explorer' | 'discoverer' | 'thinker' =
    variant === 'light' ? 'thinker' : variant
  return <Navbar variant={navVariant} />
}
