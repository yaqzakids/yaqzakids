import type { ReactNode } from 'react'
import { SiteFooter } from '@/components/SiteFooter'

export default function ParentLayout({
  children,
  bg = 'bg-bg',
}: {
  children: ReactNode
  active?: string
  bg?: string
}) {
  return (
    <div className={`min-h-screen page-transition flex flex-col ${bg}`}>
      <main className="flex-1">{children}</main>
      <SiteFooter variant="light" />
    </div>
  )
}
