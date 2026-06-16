import type { ReactNode } from 'react'
import { SiteFooter } from '@/components/SiteFooter'

export default function PublicLayout({
  children,
  bg = 'bg-[#EEF4FF]',
}: {
  children: ReactNode
  bg?: string
}) {
  return (
    <div className={`min-h-screen page-transition flex flex-col ${bg}`}>
      <div className="flex-1">{children}</div>
      <SiteFooter variant="light" />
    </div>
  )
}
