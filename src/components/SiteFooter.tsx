import Footer from './layout/Footer'

export function SiteFooter({
  variant = 'light',
  logoHeight,
}: {
  variant?: 'light' | 'dark'
  logoHeight?: number
}) {
  return <Footer variant={variant} logoHeight={logoHeight} />
}
