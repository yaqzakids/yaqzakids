import { dashboardTheme } from '@/lib/admin/dashboardTheme'
import { adminBtn, adminColors } from '@/lib/admin/styles'
import { formatDate, formatDateTime } from '@/lib/admin/utils'
import StatusBadge from '@/components/admin/StatusBadge'
import type { ProgressChildDetail } from '@/lib/admin/progress'

interface ChildProgressDrawerProps {
  open: boolean
  detail: ProgressChildDetail | null
  loading: boolean
  onClose: () => void
  onReset: () => void
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 24 }}>
      <h3
        style={{
          margin: '0 0 12px',
          fontSize: 13,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: dashboardTheme.muted,
        }}
      >
        {title}
      </h3>
      {children}
    </section>
  )
}

function StatGrid({ items }: { items: { label: string; value: string | number }[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          style={{
            padding: 12,
            borderRadius: 12,
            background: '#FFFBF0',
            border: `1px solid ${dashboardTheme.border}`,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: adminColors.muted, textTransform: 'uppercase' }}>
            {item.label}
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: dashboardTheme.navy, marginTop: 4 }}>{item.value}</div>
        </div>
      ))}
    </div>
  )
}

const activityIcons = {
  article: '📖',
  quiz: '❓',
  badge: '🏅',
  path: '🗺️',
} as const

export default function ChildProgressDrawer({
  open,
  detail,
  loading,
  onClose,
  onReset,
}: ChildProgressDrawerProps) {
  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black/45 z-40"
        onClick={onClose}
        aria-hidden
      />
      <aside
        className="fixed inset-y-0 right-0 z-50 w-full max-w-lg overflow-y-auto shadow-2xl"
        style={{ background: dashboardTheme.white, fontFamily: 'Nunito, sans-serif' }}
        role="dialog"
        aria-modal="true"
        aria-label="Child progress details"
      >
        <div
          className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-4 border-b"
          style={{ background: dashboardTheme.cream, borderColor: dashboardTheme.border }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontFamily: 'Playfair Display, serif',
                color: dashboardTheme.navy,
                fontSize: 22,
              }}
            >
              {detail?.name ?? 'Child Details'}
            </h2>
            {detail && (
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <StatusBadge label={detail.levelName} variant="gold" />
                <StatusBadge label={detail.ageGroup} variant="muted" />
              </div>
            )}
          </div>
          <button type="button" style={adminBtn.secondary} onClick={onClose}>
            Close
          </button>
        </div>

        <div className="p-5">
          {loading && (
            <p style={{ color: adminColors.muted }}>Loading child details…</p>
          )}

          {!loading && detail && (
            <>
              <Section title="Profile">
                <div className="space-y-2 text-sm" style={{ color: dashboardTheme.text }}>
                  <p style={{ margin: 0 }}><strong>Parent:</strong> {detail.parentName ?? '—'}</p>
                  <p style={{ margin: 0 }}><strong>Parent email:</strong> {detail.parentEmail ?? '—'}</p>
                  <p style={{ margin: 0 }}><strong>Age group:</strong> {detail.ageGroup}</p>
                  <p style={{ margin: 0 }}><strong>Join date:</strong> {formatDate(detail.joinDate)}</p>
                </div>
              </Section>

              <Section title="Learning">
                <StatGrid
                  items={[
                    { label: 'Total stars', value: detail.totalStars },
                    { label: 'Current streak', value: `${detail.currentStreak} days` },
                    { label: 'Longest streak', value: `${detail.longestStreak} days` },
                    { label: 'Articles completed', value: detail.articlesCompleted },
                    { label: 'Quizzes passed', value: detail.quizzesPassed },
                    { label: 'Badges earned', value: detail.badgesEarned },
                    { label: 'Hero cards', value: detail.heroCardsUnlocked },
                    { label: 'Level', value: detail.levelName },
                  ]}
                />
              </Section>

              <Section title="Adventure Progress">
                {detail.paths.length === 0 ? (
                  <p style={{ margin: 0, color: adminColors.muted, fontSize: 14 }}>No path progress yet.</p>
                ) : (
                  <div className="space-y-3">
                    {detail.paths.map((path) => (
                      <div
                        key={path.pathId}
                        style={{
                          padding: 14,
                          borderRadius: 12,
                          border: `1px solid ${dashboardTheme.border}`,
                          background: '#fff',
                        }}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <strong style={{ color: dashboardTheme.navy }}>{path.pathName}</strong>
                          <StatusBadge
                            label={path.completed ? 'Completed' : 'In progress'}
                            variant={path.completed ? 'success' : 'warning'}
                          />
                        </div>
                        <div style={{ fontSize: 13, color: adminColors.muted, marginBottom: 8 }}>
                          {path.completedArticles} / {path.totalArticles} articles · {Math.round(path.progressPercent)}%
                        </div>
                        <div
                          style={{
                            height: 8,
                            borderRadius: 999,
                            background: '#E8E4DC',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(100, path.progressPercent)}%`,
                              height: '100%',
                              background: dashboardTheme.teal,
                              borderRadius: 999,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              <Section title="Badges">
                {detail.badges.length === 0 ? (
                  <p style={{ margin: 0, color: adminColors.muted, fontSize: 14 }}>No badges earned yet.</p>
                ) : (
                  <div className="space-y-2">
                    {detail.badges.map((badge) => (
                      <div
                        key={badge.id}
                        className="flex items-center gap-3"
                        style={{
                          padding: 10,
                          borderRadius: 10,
                          border: `1px solid ${dashboardTheme.border}`,
                        }}
                      >
                        <span style={{ fontSize: 22 }}>{badge.icon ?? '🏅'}</span>
                        <div>
                          <div style={{ fontWeight: 700, color: dashboardTheme.navy }}>{badge.name}</div>
                          <div style={{ fontSize: 12, color: adminColors.muted }}>{formatDate(badge.awardedAt)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              <Section title="Recent Activity">
                {detail.recentActivity.length === 0 ? (
                  <p style={{ margin: 0, color: adminColors.muted, fontSize: 14 }}>No recent activity.</p>
                ) : (
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none' }} className="space-y-2">
                    {detail.recentActivity.map((item) => (
                      <li
                        key={item.id}
                        style={{
                          display: 'flex',
                          gap: 10,
                          padding: 10,
                          borderRadius: 10,
                          background: '#FAFAFA',
                          fontSize: 14,
                        }}
                      >
                        <span>{activityIcons[item.type]}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: dashboardTheme.navy }}>{item.label}</div>
                          <div style={{ fontSize: 12, color: adminColors.muted }}>{formatDateTime(item.occurredAt)}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              <button type="button" style={adminBtn.danger} onClick={onReset}>
                Reset Progress
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  )
}
