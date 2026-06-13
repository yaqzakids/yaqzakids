import { useNavigate, Link } from 'react-router-dom'
import { STORAGE_KEYS } from '../lib/constants'
import { LanguagePickerOnboarding } from '../components/ui/LanguageSwitcher'
import { SiteFooter } from '@/components/SiteFooter'
import { useT } from '../i18n'

const cardStyles = [
  {
    id: 'explorer',
    imageUrl: 'https://i.ibb.co/1fvKwtzD/Chat-GPT-Image-Jun-3-2026-07-24-06-PM.png',
    to: '/explorer' as const,
    titleColor: '#D4820A',
    agesColor: '#E8A020',
    btnBg: '#F5A623',
    cardBg: 'linear-gradient(135deg, #FFF8E7, #FFFAEF)',
    borderColor: '#F5A623',
    keys: {
      title: 'explorerTitle',
      ages: 'explorerAges',
      desc: 'explorerDesc',
      cta: 'explorerCta',
    },
  },
  {
    id: 'discoverer',
    imageUrl: 'https://i.ibb.co/bMNpNMxx/Chat-GPT-Image-Jun-3-2026-07-15-02-PM.png',
    to: '/discoverer' as const,
    titleColor: '#1A7A70',
    agesColor: '#2AAFA0',
    btnBg: '#2AAFA0',
    cardBg: 'linear-gradient(135deg, #E8F8F6, #F0FDFA)',
    borderColor: '#2AAFA0',
    keys: {
      title: 'discovererTitle',
      ages: 'discovererAges',
      desc: 'discovererDesc',
      cta: 'discovererCta',
    },
  },
  {
    id: 'thinker',
    imageUrl: 'https://i.ibb.co/Fq0z4K7V/Chat-GPT-Image-Jun-3-2026-07-20-33-PM.png',
    to: '/thinker' as const,
    titleColor: '#5B3D8A',
    agesColor: '#8B6BB1',
    btnBg: '#8B6BB1',
    cardBg: 'linear-gradient(135deg, #EEF2FF, #F5F3FF)',
    borderColor: '#8B6BB1',
    keys: {
      title: 'thinkerTitle',
      ages: 'thinkerAges',
      desc: 'thinkerDesc',
      cta: 'thinkerCta',
    },
  },
] as const

export default function Welcome() {
  const navigate = useNavigate()
  const t = useT()

  function pick(id: string, to: '/explorer' | '/discoverer' | '/thinker') {
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEYS.ageGroup, id)
    navigate(to)
  }

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{
        backgroundImage: 'url(https://i.ibb.co/YTbzfdLX/Yaffa-4.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="flex-1" style={{ minHeight: '100vh' }}>
        <div style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '0 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          <div style={{ textAlign: 'center', paddingTop: '60px' }}>
            <h1 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '42px',
              fontWeight: 800,
              color: '#1B2F5E',
              margin: 0,
            }}>
              {t.home.heroTitle}
            </h1>
            <p style={{
              marginTop: '12px',
              fontSize: '18px',
              color: '#6B7280',
              fontFamily: 'Nunito, sans-serif',
            }}>
              {t.home.heroSubtitle}
            </p>
          </div>

          <LanguagePickerOnboarding />

          <div style={{
            marginTop: '32px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '20px',
            width: '100%',
          }}>
            {cardStyles.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => pick(c.id, c.to)}
                style={{
                  background: c.cardBg,
                  border: `3px solid ${c.borderColor}`,
                  borderRadius: '20px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)'
                  e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{ width: '100%', height: '320px', overflow: 'hidden' }}>
                  <img
                    src={c.imageUrl}
                    alt={t.welcome[c.keys.title]}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center 15%',
                      borderRadius: '14px 14px 0 0',
                    }}
                  />
                </div>
                <div style={{ padding: '20px 20px 24px', display: 'flex', flexDirection: 'column' }}>
                  <h2 style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: '24px',
                    fontWeight: 700,
                    color: c.titleColor,
                    margin: 0,
                  }}>
                    {t.welcome[c.keys.title]}
                  </h2>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: c.agesColor,
                    marginTop: '2px',
                    fontFamily: 'Nunito, sans-serif',
                  }}>
                    {t.welcome[c.keys.ages]}
                  </div>
                  <p style={{
                    marginTop: '8px',
                    fontSize: '13px',
                    color: '#374151',
                    lineHeight: 1.6,
                    fontFamily: 'Nunito, sans-serif',
                    flex: 1,
                  }}>
                    {t.welcome[c.keys.desc]}
                  </p>
                  <div style={{
                    marginTop: '16px',
                    background: c.btnBg,
                    color: 'white',
                    borderRadius: '999px',
                    padding: '11px 20px',
                    fontSize: '13px',
                    fontWeight: 800,
                    textAlign: 'center',
                    fontFamily: 'Nunito, sans-serif',
                  }}>
                    {t.welcome[c.keys.cta]}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <p style={{
            marginTop: '20px',
            fontSize: '11px',
            color: '#9CA3AF',
            textAlign: 'center',
            fontFamily: 'Nunito, sans-serif',
          }}>
            {t.home.parentNote}{' '}
            <Link to="/login" style={{ color: '#9CA3AF', textDecoration: 'underline' }}>
              {t.home.parentDashboard}
            </Link>
          </p>
        </div>
      </div>
      <SiteFooter variant="light" />
    </div>
  )
}
