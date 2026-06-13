import type { ReactNode } from 'react'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'

export default function DiscovererPageShell({
  children,
  bg = 'bg-[#EEF4FF]',
}: {
  children: ReactNode
  bg?: string
}) {
  return (
    <div className={`min-h-screen page-transition ${bg}`}>
      <SiteNav variant="discoverer" />
      {children}
      <SiteFooter variant="light" />
    </div>
  )
}
