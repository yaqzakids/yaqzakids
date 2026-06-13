import { Link, useNavigate } from 'react-router-dom'

interface PageBackNavProps {
  fallbackTo?: string
  backLabel?: string
  showHome?: boolean
  homeTo?: string
  className?: string
}

export default function PageBackNav({
  fallbackTo = '/',
  backLabel = '← Back',
  showHome = true,
  homeTo = '/',
  className = '',
}: PageBackNavProps) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate(fallbackTo)
    }
  }

  return (
    <nav
      className={`flex items-center gap-4 text-sm font-bold ${className}`}
      aria-label="Page navigation"
    >
      <button
        type="button"
        onClick={handleBack}
        className="text-[#6B7280] hover:text-[#1B2F5E] transition-colors"
      >
        {backLabel}
      </button>
      {showHome && (
        <Link to={homeTo} className="text-[#2AAFA0] hover:opacity-80 transition-opacity">
          Home
        </Link>
      )}
    </nav>
  )
}
