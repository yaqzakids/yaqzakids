import type { ReactNode } from 'react'
import { SiteFooter } from '@/components/SiteFooter'
import PageBackNav from '@/components/navigation/PageBackNav'
import Breadcrumbs, { type BreadcrumbItem } from '@/components/navigation/Breadcrumbs'

export default function DiscovererPageShell({
  children,
  bg = 'bg-[#EEF4FF]',
  backFallback,
  backLabel,
  breadcrumbs,
  homeTo,
}: {
  children: ReactNode
  bg?: string
  backFallback?: string
  backLabel?: string
  breadcrumbs?: BreadcrumbItem[]
  homeTo?: string
  navMode?: 'public' | 'child'
}) {
  const showSubNav = backFallback || breadcrumbs

  return (
    <div className={`min-h-screen page-transition ${bg}`}>
      {showSubNav && (
        <div className="max-w-7xl mx-auto px-4 md:px-10 pt-4">
          {backFallback && (
            <PageBackNav
              fallbackTo={backFallback}
              backLabel={backLabel}
              homeTo={homeTo ?? backFallback}
            />
          )}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <Breadcrumbs items={breadcrumbs} className={backFallback ? 'mt-2' : ''} />
          )}
        </div>
      )}
      {children}
      <SiteFooter variant="light" />
    </div>
  )
}
