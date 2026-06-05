import { useNavigate } from 'react-router-dom'
import { IMAGES, COLORS, STORAGE_KEYS } from '../lib/constants'
import type { AgeGroup } from '../lib/types'

const ageGroups: {
  id: AgeGroup
  title: string
  titleColor: string
  age: string
  ageColor: string
  description: string
  buttonText: string
  buttonBg: string
  image: string
  bg: string
  border: string
}[] = [
  {
    id: 'explorer',
    title: 'Explorer',
    titleColor: '#D4820A',
    age: 'Ages 5–8',
    ageColor: '#E8A020',
    description: 'Short fun stories, colourful adventures and exciting facts!',
    buttonText: "Let's Explore! →",
    buttonBg: '#F5A623',
    image: IMAGES.explorerCard,
    bg: COLORS.explorer.bg,
    border: '#F5A623',
  },
  {
    id: 'discoverer',
    title: 'Discoverer',
    titleColor: '#1A7A70',
    age: 'Ages 9–12',
    ageColor: '#2AAFA0',
    description: 'Real news, fascinating science and inspiring history!',
    buttonText: 'Start Discovering! →',
    buttonBg: '#2AAFA0',
    image: IMAGES.discovererCard,
    bg: COLORS.discoverer.bg,
    border: '#2AAFA0',
  },
  {
    id: 'thinker',
    title: 'Thinker',
    titleColor: '#5B3D8A',
    age: 'Ages 13–16',
    ageColor: '#8B6BB1',
    description: 'Deep analysis, real-world challenges for sharp minds.',
    buttonText: 'Start Thinking! →',
    buttonBg: '#8B6BB1',
    image: IMAGES.thinkerCard,
    bg: COLORS.thinker.bg,
    border: '#8B6BB1',
  },
]

export default function Welcome() {
  const navigate = useNavigate()

  const selectAgeGroup = (group: AgeGroup) => {
    localStorage.setItem(STORAGE_KEYS.ageGroup, group)
    navigate(`/${group}`)
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12 page-transition"
      style={{
        backgroundImage: `url(${IMAGES.welcomeBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <h1 className="font-display text-4xl font-extrabold text-navy text-center mb-3">
        Who's learning today?
      </h1>
      <p className="text-muted text-lg text-center mb-10 max-w-md">
        Explore the world through faith, curiosity and knowledge.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[900px] w-full">
        {ageGroups.map((group) => (
          <div
            key={group.id}
            onClick={() => selectAgeGroup(group.id)}
            className="rounded-3xl overflow-hidden cursor-pointer transition-all hover:-translate-y-1.5 hover:shadow-xl"
            style={{ background: group.bg, border: `3px solid ${group.border}` }}
          >
            <img src={group.image} alt={group.title} className="w-full h-[220px] object-cover" />
            <div className="p-5">
              <h2 className="font-display text-[26px] font-bold mb-1" style={{ color: group.titleColor }}>
                {group.title}
              </h2>
              <p className="text-sm font-semibold mb-2" style={{ color: group.ageColor }}>{group.age}</p>
              <p className="text-sm text-muted mb-4">{group.description}</p>
              <button
                className="w-full py-3 rounded-full text-white font-extrabold text-sm hover:opacity-90 transition-opacity"
                style={{ background: group.buttonBg }}
              >
                {group.buttonText}
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[#9CA3AF] text-xs mt-6 text-center">
        Parents can set and manage age groups from the parent dashboard
      </p>
    </div>
  )
}
