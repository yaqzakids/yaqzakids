/**
 * /adventures route — rendered via App.tsx → AdventurePathsPage
 * Layout: single 3-column grid of all adventure paths
 */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/components/ProtectedRoute'
import { useSelectedChild } from '@/context/SelectedChildContext'
import ChildProfileSwitcher from '@/components/adventure/ChildProfileSwitcher'
import StarsDisplay from '@/components/adventure/StarsDisplay'
import PathCard from '@/components/adventure/PathCard'
import BadgeDisplay from '@/components/adventure/BadgeDisplay'
import HeroCardCollection from '@/components/adventure/HeroCardCollection'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorMessage from '@/components/ErrorMessage'
import { SiteNav } from '@/components/SiteNav'
import PublicNav from '@/components/layout/PublicNav'
import { STORAGE_KEYS } from '@/lib/constants'
import { fetchPathsWithProgress } from '@/lib/adventure/service'
import { DISCOVERER_PATH_FILTERS } from '@/lib/discoverer'
import type { PathWithProgress } from '@/lib/adventure/types'
import type { AgeGroup } from '@/lib/types'

const pageStyle = { background: '#EEF4FF', minHeight: '100vh' } as const
const headlineStyle = {
  fontFamily: '"Playfair Display", serif',
  fontSize: 40,
  fontWeight: 700,
  color: '#1B2F5E',
  lineHeight: 1.15,
  margin: 0,
} as const
const subtitleStyle = { color: '#6B7280', marginTop: 12, fontSize: 16, marginBottom: 0 } as const

function pathMatchesFilter(path: PathWithProgress, filterId: string): boolean {
  if (filterId === 'all') return true
  const title = `${path.title} ${path.pillar?.name ?? ''} ${path.pillar?.slug ?? ''}`.toLowerCase()
  const map: Record<string, string[]> = {
    science: ['science', 'nature'],
    history: ['history', 'civilization', 'people'],
    current: ['current', 'events', 'news'],
    technology: ['technology', 'tech', 'ai'],
    geography: ['geography', 'culture', 'cultures'],
    environment: ['environment', 'climate', 'earth'],
    faith: ['faith', 'islam', 'foundation'],
  }
  return (map[filterId] ?? []).some((kw) => title.includes(kw))
}

function AdventurePathsContent() {
  const { user } = useAuth()
  const { selectedChild } = useSelectedChild()
  const [paths, setPaths] = useState<PathWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState('all')
  const ageGroup = (localStorage.getItem(STORAGE_KEYS.ageGroup) as AgeGroup) ?? 'explorer'
  const isDiscoverer = ageGroup === 'discoverer' || selectedChild?.age_group === 'discoverer'

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchPathsWithProgress(selectedChild?.id ?? null, user?.id ?? null)
      setPaths(data.paths)
    } catch {
      setError('Could not load adventure paths.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [selectedChild?.id, user?.id])

  const allPaths = useMemo(
    () =>
      [...paths].sort((a, b) => {
        const pillarOrderA = a.pillar?.sort_order ?? 0
        const pillarOrderB = b.pillar?.sort_order ?? 0
        if (pillarOrderA !== pillarOrderB) return pillarOrderA - pillarOrderB
        return a.sort_order - b.sort_order
      }),
    [paths]
  )

  const filteredPaths = useMemo(
    () => allPaths.filter((p) => pathMatchesFilter(p, activeFilter)),
    [allPaths, activeFilter]
  )

  const navVariant =
    selectedChild?.age_group === 'thinker'
      ? 'thinker'
      : selectedChild?.age_group === 'explorer'
        ? 'explorer'
        : 'discoverer'

  return (
    <div style={pageStyle} data-page="adventures-v3">
      {selectedChild ? (
        <SiteNav variant={navVariant} />
      ) : (
        <PublicNav />
      )}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 40px 64px' }}>
        {/* Page header */}
        <header>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 24,
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <div style={{ flex: 1, minWidth: 280 }}>
              <h1 style={headlineStyle}>Choose Your Adventure</h1>
              <p style={subtitleStyle}>
                Every path unlocks new knowledge, badges and hero cards
              </p>
              {user && (
                <div style={{ marginTop: 24 }}>
                  <ChildProfileSwitcher />
                </div>
              )}
              {!user && (
                <Link
                  to="/login"
                  style={{
                    display: 'inline-block',
                    marginTop: 16,
                    color: '#2AAFA0',
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  Sign in to save progress →
                </Link>
              )}
            </div>
            {selectedChild && (
              <div style={{ flexShrink: 0 }}>
                <StarsDisplay childId={selectedChild.id} />
              </div>
            )}
          </div>
        </header>

        {isDiscoverer && (
          <div className="flex flex-wrap gap-2 mb-6">
            {DISCOVERER_PATH_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id)}
                className={`px-4 py-2 rounded-full text-sm font-extrabold transition-colors ${
                  activeFilter === f.id
                    ? 'bg-navy text-white'
                    : 'bg-white text-navy border border-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div style={{ paddingTop: 80, paddingBottom: 80 }}>
            <LoadingSpinner />
          </div>
        )}
        {error && <ErrorMessage message={error} onRetry={load} />}

        {!loading && !error && filteredPaths.length === 0 && (
          <p style={{ textAlign: 'center', color: '#6B7280', padding: '48px 0' }}>
            No paths match this filter.
          </p>
        )}

        {!loading && !error && filteredPaths.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '24px',
              width: '100%',
              marginTop: '32px',
            }}
          >
            {filteredPaths.map((path) => (
              <PathCard key={path.id} path={path} />
            ))}
          </div>
        )}

        {user && selectedChild && (
          <div style={{ marginTop: 48, paddingTop: 40, borderTop: '1px solid rgba(209,213,219,0.6)' }}>
            <section style={{ marginBottom: 48 }}>
              <h2
                style={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: 24,
                  fontWeight: 700,
                  color: '#1B2F5E',
                  marginBottom: 24,
                }}
              >
                🏅 Your Badges
              </h2>
              <BadgeDisplay childId={selectedChild.id} />
            </section>
            <section>
              <h2
                style={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: 24,
                  fontWeight: 700,
                  color: '#1B2F5E',
                  marginBottom: 24,
                }}
              >
                🃏 Hero Cards
              </h2>
              <HeroCardCollection childId={selectedChild.id} />
            </section>
          </div>
        )}
      </main>
    </div>
  )
}

export default function AdventurePathsPage() {
  return <AdventurePathsContent />
}
