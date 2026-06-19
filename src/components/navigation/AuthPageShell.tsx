import { Link, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { SiteFooter } from '@/components/SiteFooter'
import BrandLogo from '@/components/BrandLogo'
import { PUBLIC_HOME_PATH } from '@/lib/navigation'

interface AuthPageShellProps {
  children: ReactNode
}

export default function AuthPageShell({ children }: AuthPageShellProps) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate(PUBLIC_HOME_PATH)
    }
  }

  return (
    <div className="min-h-screen bg-bg page-transition flex flex-col">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <BrandLogo to={PUBLIC_HOME_PATH} height={44} />
          <div className="flex items-center gap-4 text-sm font-bold">
            <button
              type="button"
              onClick={handleBack}
              className="text-[#6B7280] hover:text-[#1B2F5E] transition-colors"
            >
              ← Back
            </button>
            <Link to={PUBLIC_HOME_PATH} className="text-[#2AAFA0] hover:opacity-80 transition-opacity">
              Home
            </Link>
          </div>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center px-4 py-10 md:py-14">{children}</div>
      <SiteFooter variant="light" />
    </div>
  )
}
