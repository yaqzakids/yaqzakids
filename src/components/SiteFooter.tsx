import Footer from './layout/Footer'

export function SiteFooter({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  return <Footer variant={variant} />
}
