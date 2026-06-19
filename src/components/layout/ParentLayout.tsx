import type { ReactNode } from 'react'
import { SiteFooter } from '@/components/SiteFooter'
import ParentAreaSidebar from '@/components/parent/ParentAreaSidebar'

export default function ParentLayout({
  children,
  active,
  bg = 'bg-bg',
  showSidebar = false,
}: {
  children: ReactNode
  active?: string
  bg?: string
  showSidebar?: boolean
}) {
  if (!showSidebar) {
    return (
      <div className={`min-h-screen page-transition flex flex-col ${bg}`}>
        <main className="flex-1">{children}</main>
        <SiteFooter variant="light" />
      </div>
    )
  }

  return (
    <div className={`min-h-screen page-transition flex flex-col ${bg}`}>
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            <ParentAreaSidebar active={active} />
            <div className="flex-1 min-w-0">{children}</div>
          </div>
        </div>
      </main>
      <SiteFooter variant="light" />
    </div>
  )
}
