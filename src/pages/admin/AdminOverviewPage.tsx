import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { fetchDashboardOverview, type DashboardOverviewData } from '@/lib/admin/overview'
import AdminStatCard from '@/components/admin/AdminStatCard'
import { CardSkeleton } from '@/components/admin/AdminSkeleton'
import { dashboardCard, dashboardTheme } from '@/lib/admin/dashboardTheme'
import { useAdminShell } from '@/context/AdminShellContext'
import { formatDate, formatDateTime } from '@/lib/admin/utils'

const ADMIN_HUB_CARDS = [
  {
    title: 'Explorer Content Admin',
    description: 'Stories, paths, and quizzes for ages 6–8',
    icon: '🌱',
    to: '/admin/articles?band=explorer',
  },
  {
    title: 'Discoverer Content Admin',
    description: 'Stories, paths, and quizzes for ages 9–12',
    icon: '🔭',
    to: '/admin/articles?band=discoverer',
  },
  {
    title: 'Thinker Content Admin',
    description: 'Stories, paths, and quizzes for ages 13–16',
    icon: '🌍',
    to: '/admin/articles?band=thinker',
  },
  { title: 'Articles', description: 'Create and publish articles', icon: '📝', to: '/admin/articles' },
  { title: 'Quizzes', description: 'Manage quiz questions', icon: '❓', to: '/admin/quizzes' },
  { title: 'Families', description: 'Parents and child profiles', icon: '👨‍👩‍👧', to: '/admin/families' },
  { title: 'Progress', description: 'Learning progress across families', icon: '📈', to: '/admin/progress' },
  { title: 'Support Tickets', description: 'Help families and resolve issues', icon: '🎫', to: '/admin/support' },
  { title: 'Broadcast Center', description: 'Announcements and messages', icon: '📢', to: '/admin/announcements' },
  { title: 'Settings', description: 'Platform and admin settings', icon: '⚙️', to: '/admin/settings' },
] as const

const QUICK_ACTIONS = [
  { label: 'Add Article', icon: '📝', to: '/admin/articles/new' },
  { label: 'Add Quiz', icon: '❓', to: '/admin/content' },
  { label: 'Add Path', icon: '🗺️', to: '/admin/paths/new' },
  { label: 'Add Badge', icon: '🏅', to: '/admin/adventures?tab=badges' },
  { label: 'Add Hero Card', icon: '🦸', to: '/admin/adventures?tab=hero_cards' },
  { label: 'Send Announcement', icon: '📢', to: null },
  { label: 'Create Coupon', icon: '🎟️', to: '/admin/discounts' },
  { label: 'View Analytics', icon: '📈', to: '/admin/analytics' },
  { label: 'Support Tickets', icon: '🎫', to: '/admin/support' },
] as const

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

export default function AdminOverviewPage() {
  const { adminName } = useAdminShell()
  const [data, setData] = useState<DashboardOverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardOverview()
      .then(setData)
      .catch(() => setError('Could not load dashboard. Run migration 004_admin_dashboard.sql in Supabase.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <CardSkeleton count={8} />
  if (error) return <p style={{ color: '#dc2626' }}>{error}</p>
  if (!data) return null

  const { stats, userGrowth, usersByType, activePillars, recentTickets, recentActivity, latestFamilies } = data
  const maxPillar = Math.max(...activePillars.map((p) => p.count), 1)
  const firstName = adminName.split(' ')[0]

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <div>
        <h1
          style={{
            margin: 0,
            fontFamily: 'Playfair Display, serif',
            color: dashboardTheme.navy,
            fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
            fontWeight: 800,
          }}
        >
          Overview
        </h1>
        <p style={{ margin: '8px 0 0', fontSize: 16, color: dashboardTheme.navy, fontWeight: 600 }}>
          Welcome back, {firstName} 👋
        </p>
        <p style={{ margin: '4px 0 0', fontSize: 14, color: dashboardTheme.muted }}>
          Here&apos;s what&apos;s happening on Yaqza Kids today.
        </p>
      </div>

      <div style={{ ...dashboardCard, padding: 20 }}>
        <h3
          style={{
            margin: '0 0 16px',
            fontFamily: 'Playfair Display, serif',
            color: dashboardTheme.navy,
            fontSize: 18,
            fontWeight: 700,
          }}
        >
          Admin Sections
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {ADMIN_HUB_CARDS.map((card) => (
            <Link
              key={card.title}
              to={card.to}
              className="flex gap-3 p-4 rounded-xl no-underline transition-transform hover:scale-[1.01]"
              style={{
                background: '#FAF8F2',
                border: `1px solid ${dashboardTheme.border}`,
              }}
            >
              <span className="text-2xl shrink-0" aria-hidden>
                {card.icon}
              </span>
              <div>
                <div className="text-sm font-bold" style={{ color: dashboardTheme.navy }}>
                  {card.title}
                </div>
                <div className="text-xs mt-1 leading-relaxed" style={{ color: dashboardTheme.muted }}>
                  {card.description}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7 gap-4">
        <AdminStatCard label="Total Parents" value={stats.totalParentAccounts} accent="parents" />
        <AdminStatCard label="Total Children" value={stats.totalChildProfiles} accent="children" />
        <AdminStatCard label="Active Subscribers" value={stats.activeSubscribers} accent="subscribers" />
        <AdminStatCard label="Free Users" value={stats.freeUsers} accent="free" />
        <AdminStatCard label="Total Articles" value={stats.totalArticles} accent="articles" />
        <AdminStatCard label="Published Articles" value={stats.publishedArticles} accent="published" />
        <AdminStatCard label="Total Quizzes" value={stats.totalQuizzes} accent="quizzes" />
      </div>

      {/* Middle widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <WidgetCard title="User Growth">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={userGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DC" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="parents" name="Parents" stroke={dashboardTheme.navy} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="children" name="Children" stroke={dashboardTheme.gold} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-xs font-semibold">
            <span style={{ color: dashboardTheme.navy }}>● Parents</span>
            <span style={{ color: dashboardTheme.gold }}>● Children</span>
          </div>
        </WidgetCard>

        <WidgetCard title="Users by Type">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={usersByType} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3}>
                {usersByType.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <ul className="space-y-1 mt-2">
            {usersByType.map((u) => (
              <li key={u.name} className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: u.color }} />
                  {u.name}
                </span>
                <span className="font-bold" style={{ color: dashboardTheme.navy }}>{u.value}</span>
              </li>
            ))}
          </ul>
        </WidgetCard>

        <WidgetCard title="Most Active Pillars">
          {activePillars.length === 0 ? (
            <p style={{ color: dashboardTheme.muted, fontSize: 14, margin: 0 }}>No pillar activity yet.</p>
          ) : (
            <ul className="space-y-3">
              {activePillars.map((p) => (
                <li key={p.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold" style={{ color: dashboardTheme.navy }}>{p.name}</span>
                    <span style={{ color: dashboardTheme.muted }}>{p.count}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: '#F0EDE6' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${(p.count / maxPillar) * 100}%`, background: p.color }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </WidgetCard>
      </div>

      {/* Lower widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <WidgetCard title="Recent Support Tickets">
          {recentTickets.length === 0 ? (
            <div className="text-center py-6">
              <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
              <p style={{ margin: 0, fontWeight: 700, color: dashboardTheme.navy }}>No open tickets</p>
              <p style={{ margin: '8px 0 0', fontSize: 13, color: dashboardTheme.muted }}>
                You&apos;re all caught up! New tickets will appear here.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[#F0EDE6]">
              {recentTickets.map((t) => (
                <li key={t.id} className="py-3 first:pt-0">
                  <div className="font-semibold text-sm" style={{ color: dashboardTheme.navy }}>{t.subject}</div>
                  <div className="text-xs mt-1" style={{ color: dashboardTheme.muted }}>
                    {t.status.replace('_', ' ')} · {formatDateTime(t.created_at)}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link to="/admin/support" className="inline-block mt-3 text-sm font-bold no-underline" style={{ color: dashboardTheme.teal }}>
            View all tickets →
          </Link>
        </WidgetCard>

        <WidgetCard title="Recent Activity">
          {recentActivity.length === 0 ? (
            <div className="space-y-3">
              {[
                { icon: '📝', action: 'Article published', time: 'Placeholder' },
                { icon: '👤', action: 'New parent registered', time: 'Placeholder' },
                { icon: '⚙️', action: 'Settings updated', time: 'Placeholder' },
              ].map((a) => (
                <div key={a.action} className="flex items-center gap-3 opacity-60">
                  <span className="text-lg">{a.icon}</span>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: dashboardTheme.navy }}>{a.action}</div>
                    <div className="text-xs" style={{ color: dashboardTheme.muted }}>{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ul className="space-y-3">
              {recentActivity.map((a) => (
                <li key={a.id} className="flex items-start gap-3">
                  <span className="text-lg shrink-0">📋</span>
                  <div>
                    <div className="text-sm font-semibold capitalize" style={{ color: dashboardTheme.navy }}>
                      {a.action.replace(/_/g, ' ')}
                    </div>
                    <div className="text-xs" style={{ color: dashboardTheme.muted }}>
                      {a.admin?.full_name ?? 'Admin'} · {formatDateTime(a.created_at)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link to="/admin/log" className="inline-block mt-3 text-sm font-bold no-underline" style={{ color: dashboardTheme.teal }}>
            Full activity log →
          </Link>
        </WidgetCard>

        <WidgetCard title="Quick Actions">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {QUICK_ACTIONS.map((action) =>
              action.to ? (
                <Link
                  key={action.label}
                  to={action.to}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl no-underline text-center transition-transform hover:scale-[1.02]"
                  style={{
                    background: '#FAF8F2',
                    border: `1px solid ${dashboardTheme.border}`,
                    minHeight: 72,
                  }}
                >
                  <span className="text-xl">{action.icon}</span>
                  <span className="text-[11px] font-bold leading-tight" style={{ color: dashboardTheme.navy }}>
                    {action.label}
                  </span>
                </Link>
              ) : (
                <button
                  key={action.label}
                  type="button"
                  disabled
                  title="Coming soon"
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl text-center opacity-50 cursor-not-allowed"
                  style={{
                    background: '#FAF8F2',
                    border: `1px solid ${dashboardTheme.border}`,
                    minHeight: 72,
                  }}
                >
                  <span className="text-xl">{action.icon}</span>
                  <span className="text-[11px] font-bold leading-tight" style={{ color: dashboardTheme.navy }}>
                    {action.label}
                  </span>
                </button>
              ),
            )}
          </div>
        </WidgetCard>
      </div>

      {/* Latest families table */}
      <div style={{ ...dashboardCard, padding: 0, overflow: 'hidden' }}>
        <div className="px-6 py-5 border-b" style={{ borderColor: dashboardTheme.border }}>
          <h3
            style={{
              margin: 0,
              fontFamily: 'Playfair Display, serif',
              color: dashboardTheme.navy,
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            Latest Registered Families
          </h3>
        </div>
        {latestFamilies.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p style={{ margin: 0, color: dashboardTheme.muted }}>No families registered yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ background: '#FAF8F2' }}>
                  {['Parent Name', 'Email', 'Children', 'Joined Date', 'Status'].map((h) => (
                    <th
                      key={h}
                      className="text-left px-6 py-3 text-xs font-bold uppercase tracking-wide"
                      style={{ color: dashboardTheme.muted }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {latestFamilies.map((f) => (
                  <tr key={f.id} className="border-t" style={{ borderColor: '#F0EDE6' }}>
                    <td className="px-6 py-4 text-sm font-semibold" style={{ color: dashboardTheme.navy }}>{f.name}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: dashboardTheme.muted }}>{f.email ?? '—'}</td>
                    <td className="px-6 py-4 text-sm font-bold" style={{ color: dashboardTheme.navy }}>{f.childrenCount}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: dashboardTheme.muted }}>{formatDate(f.joined)}</td>
                    <td className="px-6 py-4">
                      <span
                        className="text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{
                          background: f.status === 'Subscribed' ? '#E6F7F5' : f.status === 'Suspended' ? '#FEE2E2' : '#F3F0FF',
                          color: f.status === 'Subscribed' ? dashboardTheme.teal : f.status === 'Suspended' ? '#DC2626' : '#7C5CFC',
                        }}
                      >
                        {f.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
