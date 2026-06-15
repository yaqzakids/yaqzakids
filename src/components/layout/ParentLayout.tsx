import type { ReactNode } from 'react'
import ParentNavbar, { type ParentNavActive } from '@/components/layout/ParentNavbar'
import { SiteFooter } from '@/components/SiteFooter'

export default function ParentLayout({
  children,
  active,
  bg = 'bg-bg',
}: {
  children: ReactNode
  active?: ParentNavActive
  bg?: string
}) {
  return (
    <div className={`min-h-screen page-transition flex flex-col ${bg}`}>
      <ParentNavbar active={active} />
      <main className="flex-1">{children}</main>
      <SiteFooter variant="light" />
    </div>
  )
}
