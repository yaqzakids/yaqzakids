import { Link } from 'react-router-dom'
import { IMAGES } from '../../lib/constants'

interface FooterProps {
  variant?: 'light' | 'dark'
}

export default function Footer({ variant = 'light' }: FooterProps) {
  const isDark = variant === 'dark'

  return (
    <footer className={`${isDark ? 'bg-navy text-white/70' : 'bg-white border-t border-gray-200'} px-4 md:px-10 pt-10 pb-6`}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <img src={IMAGES.logo} alt="Yaqza Kids" className="h-16" />
          <p className={`mt-3 text-sm ${isDark ? 'text-white/60' : 'text-muted'}`}>
            Rooted in Faith. Awake to the World.
          </p>
        </div>

        <div>
          <h4 className={`font-bold text-sm mb-3 ${isDark ? 'text-gold' : 'text-navy'}`}>EXPLORE</h4>
          <ul className="space-y-2">
            {['About Us', 'For Parents', 'Pricing', 'Get Started'].map((item) => (
              <li key={item}>
                <Link to={item === 'About Us' ? '/about' : item === 'Pricing' ? '/pricing' : '/signup'} className={`text-sm hover:opacity-80 transition-opacity ${isDark ? 'text-white/60 hover:text-white' : 'text-muted hover:text-navy'}`}>
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className={`font-bold text-sm mb-3 ${isDark ? 'text-gold' : 'text-navy'}`}>LEARN</h4>
          <ul className="space-y-2">
            {['World News', 'Science', 'Muslim World', 'All Topics'].map((item) => (
              <li key={item}>
                <a href="#" className={`text-sm hover:opacity-80 transition-opacity ${isDark ? 'text-white/60 hover:text-white' : 'text-muted hover:text-navy'}`}>{item}</a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className={`font-bold text-sm mb-3 ${isDark ? 'text-gold' : 'text-navy'}`}>LEGAL</h4>
          <ul className="space-y-2">
            {['Privacy Policy', 'Terms of Use', 'Contact Us'].map((item) => (
              <li key={item}>
                <a href="#" className={`text-sm hover:opacity-80 transition-opacity ${isDark ? 'text-white/60 hover:text-white' : 'text-muted hover:text-navy'}`}>{item}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={`mt-8 pt-5 border-t flex flex-col sm:flex-row justify-between items-center gap-4 ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
        <p className={`text-[13px] ${isDark ? 'text-white/40' : 'text-[#9CA3AF]'}`}>
          © 2026 Yaqza Kids · Tomorrow's Ummah · Rooted in Faith. Awake to the World.
        </p>
        <div className="flex gap-4">
          {['Instagram', 'Facebook', 'YouTube', 'Email'].map((social) => (
            <a key={social} href="#" className={`text-[13px] hover:opacity-80 transition-opacity ${isDark ? 'text-white/40 hover:text-white' : 'text-[#9CA3AF] hover:text-navy'}`}>
              {social === 'Instagram' ? '📷' : social === 'Facebook' ? '📘' : social === 'YouTube' ? '▶️' : '✉️'}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
