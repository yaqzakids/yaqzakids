import { Link } from 'react-router-dom'
import { PRICING_PLANS } from '../../lib/constants'

type PricingVariant = 'explorer' | 'discoverer' | 'thinker'

interface PricingProps {
  variant?: PricingVariant
}

export default function Pricing({ variant = 'explorer' }: PricingProps) {
  const isDark = variant === 'thinker'

  const buttonClasses = (style: string) => {
    const map: Record<string, string> = {
      'outline-teal': 'border-2 border-teal text-teal bg-transparent hover:bg-teal/5',
      gold: 'bg-gold text-white hover:opacity-90',
      'outline-gold': 'border-2 border-gold text-[#D4820A] bg-transparent hover:bg-gold/5',
      'outline-purple': 'border-2 border-purple text-purple bg-transparent hover:bg-purple/5',
    }
    return map[style] ?? map.gold
  }

  return (
    <section className={`py-12 px-6 md:px-10 ${isDark ? 'bg-navy' : 'bg-[#FFFBF0]'}`}>
      <p className={`text-xs font-extrabold tracking-[2px] uppercase text-center mb-2 ${isDark ? 'text-gold' : 'text-teal'}`}>
        SIMPLE PRICING
      </p>
      <h2 className={`font-display text-3xl md:text-4xl font-bold text-center mb-3 ${isDark ? 'text-white' : 'text-navy'}`}>
        One family. One price.
      </h2>
      <p className={`text-center mb-10 ${isDark ? 'text-white/60' : 'text-muted'}`}>
        No per-child fees. One subscription covers your whole family.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-[1100px] mx-auto">
        {PRICING_PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-[20px] p-7 ${isDark ? 'bg-[#243B6E]' : 'bg-white'} ${plan.borderColor}`}
          >
            <span className={`inline-block text-[10px] font-extrabold uppercase rounded-full px-2.5 py-0.5 mb-4 ${plan.badgeColor}`}>
              {plan.badge}
            </span>
            <h3 className={`font-display text-xl font-bold mb-1 ${isDark ? 'text-white' : 'text-navy'}`}>{plan.name}</h3>
            <div className="mb-4">
              <span className={`text-2xl font-extrabold ${isDark ? 'text-gold' : 'text-navy'}`}>{plan.price}</span>
              {plan.period && <span className={`text-sm ${isDark ? 'text-white/60' : 'text-muted'}`}>{plan.period}</span>}
              {'save' in plan && plan.save && (
                <span className="block text-sm text-coral font-bold mt-1">{plan.save}</span>
              )}
            </div>
            <ul className="space-y-2 mb-6">
              {plan.features.map((f) => (
                <li key={f.text} className={`text-sm flex items-start gap-2 ${isDark ? 'text-white/70' : 'text-muted'}`}>
                  <span className={f.included ? 'text-green-500' : 'text-red-400'}>{f.included ? '✓' : '✗'}</span>
                  {f.text}
                </li>
              ))}
            </ul>
            <Link
              to="/signup"
              className={`block w-full text-center py-3 rounded-full font-bold text-sm transition-opacity hover:opacity-90 ${buttonClasses(plan.buttonStyle)}`}
            >
              {plan.buttonText}
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}
