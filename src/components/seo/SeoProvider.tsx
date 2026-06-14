import { HelmetProvider } from 'react-helmet-async'
import type { ReactNode } from 'react'

export default function SeoProvider({ children }: { children: ReactNode }) {
  return <HelmetProvider>{children}</HelmetProvider>
}
