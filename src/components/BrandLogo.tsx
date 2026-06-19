import { Link } from 'react-router-dom'
import { IMAGES } from '@/lib/images'

export interface BrandLogoProps {
  to?: string
  height?: number
  className?: string
  alt?: string
  onClick?: () => void
}

export default function BrandLogo({
  to,
  height = 48,
  className = '',
  alt = 'Yaqza Kids',
  onClick,
}: BrandLogoProps) {
  const image = (
    <img
      src={IMAGES.logo}
      alt={alt}
      className={className}
      style={{ height, width: 'auto', objectFit: 'contain', display: 'block' }}
    />
  )

  if (to) {
    return (
      <Link to={to} onClick={onClick} className="inline-flex shrink-0" aria-label={alt}>
        {image}
      </Link>
    )
  }

  return image
}
