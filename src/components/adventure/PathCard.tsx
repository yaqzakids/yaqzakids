import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import type { PathWithProgress } from '@/lib/adventure/types'

const difficultyStyles = {
  easy: { bg: '#DCFCE7', color: '#15803D', label: 'EASY' },
  medium: { bg: '#FEF3C7', color: '#D4820A', label: 'MEDIUM' },
  hard: { bg: '#EDE9FE', color: '#5B3D8A', label: 'HARD' },
} as const

interface PathCardProps {
  path: PathWithProgress
}

export default function PathCard({ path }: PathCardProps) {
  const pct = path.path_progress?.completion_percentage ?? 0
  const locked = !path.accessible
  const completed = Boolean(path.path_progress?.completed)
  const lessonCount = path.lessonCount ?? path.path_progress?.total_articles ?? 0
  const completedLessons = path.path_progress?.completed_articles ?? 0

  const difficulty = difficultyStyles[path.difficulty_level]
  const badgeName = path.badge?.name
  const articleCount = path.path_progress?.total_articles

  const metaLine = [
    lessonCount > 0 ? `${lessonCount} lessons` : null,
    badgeName ?? null,
  ]
    .filter(Boolean)
    .join(' · ')

  let ctaLabel = 'Start Adventure →'
  let ctaBg = '#F5A623'
  let ctaTo = `/adventures/${path.slug}`

  if (locked) {
    ctaLabel = 'Unlock with Family Plan 🔒'
    ctaBg = '#9CA3AF'
    ctaTo = '/pricing'
  } else if (completed) {
    ctaLabel = 'Completed ✓'
    ctaBg = '#22C55E'
  } else if (completedLessons > 0 || pct > 0) {
    ctaLabel = 'Continue →'
    ctaBg = '#2AAFA0'
  }

  return (
    <article
      data-component="path-card-v2"
      style={{
        background: '#FFFFFF',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        transition: 'transform 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <div style={{ position: 'relative' }}>
        {path.cover_image_url ? (
          <img
            src={path.cover_image_url}
            alt=""
            style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: 160,
              background: 'linear-gradient(135deg, #EEF4FF, #DBEAFE)',
            }}
          />
        )}

        {path.is_free && !locked && (
          <span
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              background: '#22C55E',
              color: '#fff',
              fontSize: 11,
              fontWeight: 800,
              padding: '4px 12px',
              borderRadius: 999,
            }}
          >
            FREE
          </span>
        )}
        {locked && (
          <span
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              background: '#9CA3AF',
              color: '#fff',
              fontSize: 11,
              fontWeight: 800,
              padding: '4px 12px',
              borderRadius: 999,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Lock size={12} aria-hidden />
            LOCKED
          </span>
        )}
      </div>

      <div style={{ padding: 20 }}>
        <span
          style={{
            display: 'inline-block',
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.04em',
            padding: '4px 10px',
            borderRadius: 999,
            background: difficulty.bg,
            color: difficulty.color,
          }}
        >
          {difficulty.label}
        </span>

        <h3
          style={{
            fontFamily: '"Playfair Display", serif',
            fontSize: 18,
            fontWeight: 700,
            color: '#1B2F5E',
            margin: '12px 0 8px',
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {path.title}
        </h3>

        <p
          style={{
            fontSize: 14,
            color: '#6B7280',
            margin: '0 0 12px',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {path.description}
        </p>

        {(completedLessons > 0 || lessonCount > 0) && !locked && (
          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 12,
                fontWeight: 700,
                color: '#6B7280',
                marginBottom: 4,
              }}
            >
              <span>
                {completedLessons} / {lessonCount || articleCount || 0} lessons completed
              </span>
              <span style={{ color: '#F5A623' }}>{Math.round(pct)}%</span>
            </div>
            <div style={{ height: 8, background: '#F3F4F6', borderRadius: 999, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: completed ? '#22C55E' : '#F5A623',
                  borderRadius: 999,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        )}

        {!locked && path.nextArticleTitle && !completed && (
          <p style={{ fontSize: 12, fontWeight: 700, color: '#1B2F5E', margin: '0 0 12px' }}>
            Next up: {path.nextArticleTitle}
          </p>
        )}

        {metaLine && (
          <p style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', margin: '0 0 16px' }}>
            {metaLine}
          </p>
        )}

        <Link
          to={ctaTo}
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'center',
            padding: '12px 16px',
            borderRadius: 999,
            background: ctaBg,
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: 800,
            textDecoration: 'none',
          }}
        >
          {ctaLabel}
        </Link>
      </div>
    </article>
  )
}
