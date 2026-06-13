import { useNavigate, Link } from 'react-router-dom'
import { STORAGE_KEYS } from '../lib/constants'

const cards = [
  {
    id: 'explorer',
    imageUrl: 'https://i.ibb.co/1fvKwtzD/Chat-GPT-Image-Jun-3-2026-07-24-06-PM.png',
    title: 'Explorer',
    ages: 'Ages 5 – 8',
    desc: 'Short fun stories, colourful adventures and exciting facts about the world around you!',
    cta: "Let's Explore! →",
    to: '/explorer' as const,
    titleColor: '#D4820A',
    agesColor: '#E8A020',
    btnBg: '#F5A623',
    cardBg: 'linear-gradient(135deg, #FFF8E7, #FFFAEF)',
    borderColor: '#F5A623',
  },
  {
    id: 'discoverer',
    imageUrl: 'https://i.ibb.co/bMNpNMxx/Chat-GPT-Image-Jun-3-2026-07-15-02-PM.png',
    title: 'Discoverer',
    ages: 'Ages 9 – 12',
    desc: 'Real news, fascinating science, inspiring history and more — for curious minds like yours!',
    cta: 'Start Discovering! →',
    to: '/discoverer' as const,
    titleColor: '#1A7A70',
    agesColor: '#2AAFA0',
    btnBg: '#2AAFA0',
    cardBg: 'linear-gradient(135deg, #E8F8F6, #F0FDFA)',
    borderColor: '#2AAFA0',
  },
  {
    id: 'thinker',
    imageUrl: 'https://i.ibb.co/Fq0z4K7V/Chat-GPT-Image-Jun-3-2026-07-20-33-PM.png',
    title: 'Thinker',
    ages: 'Ages 13 – 16',
    desc: 'Explore world events, technology, ideas and challenges. Think deeply. Lead the future.',
    cta: 'Start Thinking! →',
    to: '/thinker' as const,
    titleColor: '#5B3D8A',
    agesColor: '#8B6BB1',
    btnBg: '#8B6BB1',
    cardBg: 'linear-gradient(135deg, #EEF2FF, #F5F3FF)',
    borderColor: '#8B6BB1',
  },
]

export default function Welcome() {
  const navigate = useNavigate()

  function pick(id: string, to: '/explorer' | '/discoverer' | '/thinker') {
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEYS.ageGroup, id)
    navigate(to)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundImage: 'url(https://i.ibb.co/YTbzfdLX/Yaffa-4.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div style={{ minHeight: '100vh' }}>
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
              Who's learning today?
            </h1>
            <p style={{
              marginTop: '12px',
              fontSize: '18px',
              color: '#6B7280',
              fontFamily: 'Nunito, sans-serif',
            }}>
              Explore the world through faith, curiosity and knowledge.
            </p>
          </div>

          <div style={{
            marginTop: '32px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '20px',
            width: '100%',
          }}>
            {cards.map((c) => (
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
                    alt={c.title}
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
                    {c.title}
                  </h2>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: c.agesColor,
                    marginTop: '2px',
                    fontFamily: 'Nunito, sans-serif',
                  }}>
                    {c.ages}
                  </div>
                  <p style={{
                    marginTop: '8px',
                    fontSize: '13px',
                    color: '#374151',
                    lineHeight: 1.6,
                    fontFamily: 'Nunito, sans-serif',
                    flex: 1,
                  }}>
                    {c.desc}
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
                    {c.cta}
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
            Parents can set and manage age groups from the{' '}
            <Link to="/login" style={{ color: '#9CA3AF', textDecoration: 'underline' }}>
              parent dashboard
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
