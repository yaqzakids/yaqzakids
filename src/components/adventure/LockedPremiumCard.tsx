import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'

interface LockedPremiumCardProps {
  title: string
  subtitle?: string
}

export default function LockedPremiumCard({ title, subtitle }: LockedPremiumCardProps) {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6 page-transition">
      <div className="bg-white rounded-2xl p-8 md:p-10 text-center max-w-md w-full shadow-lg border border-gray-200">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-navy/10 flex items-center justify-center">
          <Lock className="w-8 h-8 text-navy" aria-hidden />
        </div>
        <h1 className="font-display text-2xl font-bold text-navy mb-2">{title}</h1>
        <p className="text-muted text-sm mb-6">
          {subtitle ?? 'This adventure path is part of our Family Plan. Upgrade to unlock all paths and premium content.'}
        </p>
        <Link
          to="/pricing"
          className="inline-block bg-gold text-white px-8 py-3 rounded-full font-extrabold hover:opacity-90 transition-opacity"
        >
          Upgrade to Family Plan
        </Link>
      </div>
    </div>
  )
}
