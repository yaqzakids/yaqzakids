import { useCallback, useEffect, useMemo, useState } from 'react'
import AdminStatCard from '@/components/admin/AdminStatCard'
import AdminTable from '@/components/admin/AdminTable'
import ChildProgressDrawer from '@/components/admin/ChildProgressDrawer'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import EmptyState from '@/components/admin/EmptyState'
import { CardSkeleton, TableSkeleton } from '@/components/admin/AdminSkeleton'
import StatusBadge from '@/components/admin/StatusBadge'
import { adminBtn, adminInput } from '@/lib/admin/styles'
import { dashboardCard, dashboardTheme } from '@/lib/admin/dashboardTheme'
import { formatDateTime } from '@/lib/admin/utils'
import {
  fetchPopularContent,
  fetchProgressChildDetail,
  fetchProgressChildren,
  fetchProgressLeaderboard,
  fetchProgressOverview,
  fetchProgressPathOptions,
  resetChildProgress,
  type ActivityStatus,
  type PopularContentStats,
  type ProgressChildDetail,
  type ProgressChildRow,
  type ProgressLeaderboardEntry,
  type ProgressOverviewStats,
} from '@/lib/admin/progress'

function WidgetCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ ...dashboardCard, height: '100%' }}>
      <h3
        style={{
          margin: '0 0 16px',
          fontFamily: 'Playfair Display, serif',
          color: dashboardTheme.navy,
          fontSize: 18,
          fontWeight: 700,
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  )
}

function activityVariant(status: ActivityStatus): 'success' | 'warning' | 'muted' {
  if (status === 'active') return 'success'
  if (status === 'inactive') return 'warning'
  return 'muted'
}

function activityLabel(status: ActivityStatus): string {
  if (status === 'active') return 'Active'
  if (status === 'inactive') return 'Inactive'
  return 'Never started'
}

export default function AdminProgressPage() {
  const [overview, setOverview] = useState<ProgressOverviewStats | null>(null)
  const [children, setChildren] = useState<ProgressChildRow[]>([])
  const [leaderboard, setLeaderboard] = useState<ProgressLeaderboardEntry[]>([])
  const [popular, setPopular] = useState<PopularContentStats | null>(null)
  const [pathOptions, setPathOptions] = useState<{ id: string; title: string }[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [childSearch, setChildSearch] = useState('')
  const [parentSearch, setParentSearch] = useState('')
  const [ageFilter, setAgeFilter] = useState('')
  const [pathFilter, setPathFilter] = useState('')
  const [activityFilter, setActivityFilter] = useState<ActivityStatus | ''>('')

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)
  const [selectedChildName, setSelectedChildName] = useState('')
  const [detail, setDetail] = useState<ProgressChildDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const [resetTarget, setResetTarget] = useState<{ id: string; name: string } | null>(null)
  const [resetting, setResetting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [overviewData, childrenData, leaderboardData, popularData, pathsData] = await Promise.all([
        fetchProgressOverview(),
        fetchProgressChildren(),
        fetchProgressLeaderboard(),
        fetchPopularContent(),
        fetchProgressPathOptions(),
      ])
      setOverview(overviewData)
      setChildren(childrenData)
      setLeaderboard(leaderboardData)
      setPopular(popularData)
      setPathOptions(pathsData)
    } catch {
      setError('Could not load family progress data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filteredChildren = useMemo(() => {
    const childQ = childSearch.trim().toLowerCase()
    const parentQ = parentSearch.trim().toLowerCase()

    return children.filter((c) => {
      if (ageFilter && c.ageGroup !== ageFilter) return false
      if (pathFilter && !c.pathIds.includes(pathFilter)) return false
      if (activityFilter && c.activityStatus !== activityFilter) return false
      if (childQ && !c.name.toLowerCase().includes(childQ)) return false
      if (parentQ && !(c.parentEmail?.toLowerCase().includes(parentQ) ?? false)) return false
      return true
    })
  }, [children, childSearch, parentSearch, ageFilter, pathFilter, activityFilter])

  const openDetails = async (child: ProgressChildRow) => {
    setSelectedChildId(child.id)
    setSelectedChildName(child.name)
    setDrawerOpen(true)
    setDetailLoading(true)
    setDetail(null)
    try {
      setDetail(await fetchProgressChildDetail(child.id))
    } catch {
      setDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setSelectedChildId(null)
    setDetail(null)
  }

  const handleResetConfirm = async () => {
    if (!resetTarget) return
    setResetting(true)
    try {
      await resetChildProgress(resetTarget.id)
      setResetTarget(null)
      closeDrawer()
      await load()
    } finally {
      setResetting(false)
    }
  }

  const hasAnyProgress =
    (overview?.totalArticlesCompleted ?? 0) > 0 ||
    (overview?.totalQuizzesPassed ?? 0) > 0 ||
    (overview?.totalBadgesAwarded ?? 0) > 0 ||
    (overview?.totalStarsEarned ?? 0) > 0

  if (loading) {
    return (
      <div className="space-y-6">
        <CardSkeleton count={4} />
        <TableSkeleton rows={8} cols={6} />
      </div>
    )
  }

  if (error) {
    return <p style={{ color: '#dc2626' }}>{error}</p>
  }

  if (!overview) return null

  return (
    <div className="space-y-6">
      <div>
        <h1
          style={{
            margin: 0,
            fontFamily: 'Playfair Display, serif',
            color: dashboardTheme.navy,
            fontSize: 28,
          }}
        >
          Family Progress
        </h1>
        <p style={{ margin: '8px 0 0', color: dashboardTheme.muted, fontSize: 14 }}>
          Monitor learning activity across all families and children.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <AdminStatCard label="Total Children" value={overview.totalChildren} accent="children" trend="Registered profiles" />
        <AdminStatCard label="Active Children" value={overview.activeChildren} accent="subscribers" trend="Active in last 7 days" />
        <AdminStatCard label="Articles Completed" value={overview.totalArticlesCompleted} accent="articles" trend="Read + quiz passed" />
        <AdminStatCard label="Quizzes Passed" value={overview.totalQuizzesPassed} accent="quizzes" trend="Across all children" />
        <AdminStatCard label="Total Stars Earned" value={overview.totalStarsEarned} accent="subscribers" trend="From child profiles" />
        <AdminStatCard label="Badges Awarded" value={overview.totalBadgesAwarded} accent="published" trend="All time" />
        <AdminStatCard
          label="Avg. Completion Rate"
          value={`${overview.averageCompletionRate}%`}
          accent="free"
          trend="Path article completion"
        />
      </div>

      {!hasAnyProgress && children.length === 0 && (
        <div style={dashboardCard}>
          <EmptyState
            message="No learning activity yet."
            action={<span style={{ fontSize: 40 }}>📚</span>}
          />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <WidgetCard title="Most Active Children">
            {leaderboard.length === 0 ? (
              <p style={{ margin: 0, color: dashboardTheme.muted, fontSize: 14 }}>No stars earned yet.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Rank', 'Name', 'Stars', 'Level'].map((h) => (
                        <th
                          key={h}
                          style={{
                            textAlign: 'left',
                            padding: '8px 10px',
                            fontSize: 12,
                            color: dashboardTheme.muted,
                            borderBottom: `1px solid ${dashboardTheme.border}`,
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry) => (
                      <tr key={entry.childId}>
                        <td style={{ padding: '10px', fontWeight: 800, color: dashboardTheme.gold }}>#{entry.rank}</td>
                        <td style={{ padding: '10px', fontWeight: 700, color: dashboardTheme.navy }}>{entry.name}</td>
                        <td style={{ padding: '10px' }}>{entry.stars}</td>
                        <td style={{ padding: '10px' }}><StatusBadge label={entry.levelName} variant="gold" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </WidgetCard>
        </div>

        <WidgetCard title="Most Popular Content">
          <div className="space-y-4 text-sm">
            <div>
              <div style={{ fontWeight: 700, color: dashboardTheme.navy, marginBottom: 8 }}>Most completed articles</div>
              {(popular?.topArticles.length ?? 0) === 0 ? (
                <p style={{ margin: 0, color: dashboardTheme.muted }}>No data yet.</p>
              ) : (
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {popular!.topArticles.map((a) => (
                    <li key={a.id} style={{ marginBottom: 4 }}>{a.title} ({a.count})</li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: dashboardTheme.navy, marginBottom: 8 }}>Most completed paths</div>
              {(popular?.topPaths.length ?? 0) === 0 ? (
                <p style={{ margin: 0, color: dashboardTheme.muted }}>No data yet.</p>
              ) : (
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {popular!.topPaths.map((p) => (
                    <li key={p.id} style={{ marginBottom: 4 }}>{p.title} ({p.count})</li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: dashboardTheme.navy, marginBottom: 8 }}>Most earned badges</div>
              {(popular?.topBadges.length ?? 0) === 0 ? (
                <p style={{ margin: 0, color: dashboardTheme.muted }}>No data yet.</p>
              ) : (
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {popular!.topBadges.map((b) => (
                    <li key={b.id} style={{ marginBottom: 4 }}>{b.icon ?? '🏅'} {b.name} ({b.count})</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </WidgetCard>
      </div>

      <div style={dashboardCard}>
        <h3
          style={{
            margin: '0 0 16px',
            fontFamily: 'Playfair Display, serif',
            color: dashboardTheme.navy,
            fontSize: 18,
          }}
        >
          Child Progress
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 mb-4">
          <input
            placeholder="Search child name…"
            value={childSearch}
            onChange={(e) => setChildSearch(e.target.value)}
            style={adminInput}
          />
          <input
            placeholder="Search parent email…"
            value={parentSearch}
            onChange={(e) => setParentSearch(e.target.value)}
            style={adminInput}
          />
          <select value={ageFilter} onChange={(e) => setAgeFilter(e.target.value)} style={adminInput}>
            <option value="">All age groups</option>
            <option value="explorer">Explorer</option>
            <option value="discoverer">Discoverer</option>
            <option value="thinker">Thinker</option>
          </select>
          <select value={pathFilter} onChange={(e) => setPathFilter(e.target.value)} style={adminInput}>
            <option value="">All paths</option>
            {pathOptions.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
          <select
            value={activityFilter}
            onChange={(e) => setActivityFilter(e.target.value as ActivityStatus | '')}
            style={adminInput}
          >
            <option value="">All activity</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="never">Never started</option>
          </select>
        </div>

        {filteredChildren.length === 0 ? (
          <EmptyState
            message={children.length === 0 ? 'No learning activity yet.' : 'No children match your filters.'}
            action={<span style={{ fontSize: 36 }}>👶</span>}
          />
        ) : (
          <AdminTable
            rows={filteredChildren}
            rowKey={(row) => row.id}
            emptyMessage="No children found."
            columns={[
              { key: 'name', header: 'Child Name', render: (c) => <strong>{c.name}</strong> },
              { key: 'email', header: 'Parent Email', render: (c) => c.parentEmail ?? '—' },
              {
                key: 'age',
                header: 'Age Group',
                render: (c) => <StatusBadge label={c.ageGroup} variant="gold" />,
              },
              { key: 'stars', header: 'Stars', render: (c) => c.stars },
              { key: 'streak', header: 'Current Streak', render: (c) => `${c.currentStreak} days` },
              { key: 'articles', header: 'Articles Completed', render: (c) => c.articlesCompleted },
              { key: 'quizzes', header: 'Quizzes Passed', render: (c) => c.quizzesPassed },
              { key: 'badges', header: 'Badges Earned', render: (c) => c.badgesEarned },
              {
                key: 'level',
                header: 'Current Level',
                render: (c) => <StatusBadge label={c.levelName} variant="gold" />,
              },
              {
                key: 'lastActive',
                header: 'Last Active',
                render: (c) => formatDateTime(c.lastActive),
              },
              {
                key: 'status',
                header: 'Status',
                render: (c) => (
                  <StatusBadge label={activityLabel(c.activityStatus)} variant={activityVariant(c.activityStatus)} />
                ),
              },
              {
                key: 'actions',
                header: 'Actions',
                render: (c) => (
                  <div className="flex flex-wrap gap-2">
                    <button type="button" style={adminBtn.secondary} onClick={() => openDetails(c)}>
                      View Details
                    </button>
                    <button
                      type="button"
                      style={adminBtn.danger}
                      onClick={() => setResetTarget({ id: c.id, name: c.name })}
                    >
                      Reset Progress
                    </button>
                  </div>
                ),
              },
            ]}
          />
        )}
      </div>

      <ChildProgressDrawer
        open={drawerOpen}
        detail={detail}
        loading={detailLoading}
        onClose={closeDrawer}
        onReset={() => {
          if (selectedChildId) {
            setResetTarget({ id: selectedChildId, name: selectedChildName })
          }
        }}
      />

      <ConfirmDialog
        open={!!resetTarget}
        title="Reset progress?"
        message={`This will permanently reset all learning progress for "${resetTarget?.name}". This cannot be undone.`}
        confirmLabel="Reset Progress"
        danger
        loading={resetting}
        onConfirm={handleResetConfirm}
        onCancel={() => setResetTarget(null)}
      />
    </div>
  )
}
