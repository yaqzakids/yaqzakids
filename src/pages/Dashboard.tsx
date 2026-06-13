import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../components/ProtectedRoute'
import { getProfile, getChildProfiles, getSubscription, getRecentProgress } from '../lib/supabase'
import { fetchChildDashboardAnalytics } from '../lib/adventure/engagement'
import type { ChildProfile, Profile, Progress, Subscription } from '../lib/types'
import type { ChildDashboardAnalytics } from '../lib/adventure/types'
import ChildAnalyticsCard from '../components/dashboard/ChildAnalyticsCard'
import DashboardSkeleton from '../components/dashboard/DashboardSkeleton'
import ErrorMessage from '../components/ErrorMessage'
import AnnouncementBanner from '@/components/messaging/AnnouncementBanner'
import ParentNavLinks from '@/components/messaging/ParentNavLinks'
import PageBackNav from '@/components/navigation/PageBackNav'
import Breadcrumbs from '@/components/navigation/Breadcrumbs'
import { DiscovererReportSection } from '@/components/dashboard/DiscovererReportTab'
import { formatSupabaseError } from '../lib/supabaseErrors'

function getErrorMessage(err: unknown): string {
  return formatSupabaseError(err)
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [children, setChildren] = useState<ChildProfile[]>([])
  const [analyticsMap, setAnalyticsMap] = useState<Record<string, ChildDashboardAnalytics>>({})
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [recentActivity, setRecentActivity] = useState<Progress[]>([])
  const [loading, setLoading] = useState(true)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    if (!user) return
    setLoading(true)
    setAnalyticsLoading(true)
    setError(null)
    try {
      const [prof, kids, sub] = await Promise.all([
        getProfile(user.id),
        getChildProfiles(user.id),
        getSubscription(user.id),
      ])
      setProfile(prof)
      setChildren(kids)
      setSubscription(sub)
      setLoading(false)

      const [activity, ...analyticsResults] = await Promise.all([
        getRecentProgress(kids.map((c) => c.id)),
        ...kids.map((c) => fetchChildDashboardAnalytics(c.id)),
      ])
      setRecentActivity(activity)

      const map: Record<string, ChildDashboardAnalytics> = {}
      kids.forEach((c, i) => {
        map[c.id] = analyticsResults[i] as ChildDashboardAnalytics
      })
      setAnalyticsMap(map)
    } catch (err) {
      console.error('Dashboard fetch failed:', err)
      console.log('Dashboard fetch error message:', getErrorMessage(err))
      if (err && typeof err === 'object') {
        console.log('Dashboard fetch error details:', JSON.stringify(err, null, 2))
      }
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
      setAnalyticsLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && user) fetchData()
  }, [user, authLoading])

  const planLabel = subscription?.plan?.replace('_', ' ') ?? 'free'

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-bg page-transition">
        <nav className="bg-white border-b border-gray-200 px-6 md:px-10 h-16" />
        <div className="max-w-5xl mx-auto px-6 md:px-10 py-10">
          <div className="h-8 bg-gray-200 rounded w-64 mb-10 animate-pulse" />
          <DashboardSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg page-transition">
      <nav className="bg-white border-b border-gray-200 px-6 md:px-10 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <Link to="/" className="font-display font-bold text-navy tracking-tight no-underline">
            YAQZA KIDS
          </Link>
          <PageBackNav fallbackTo="/children" homeTo="/" showHome />
        </div>
        <div className="flex items-center gap-4">
          <ParentNavLinks active="dashboard" />
          <button
            onClick={() => supabaseSignOut()}
            className="text-sm text-muted hover:text-navy transition-colors"
          >
            Sign Out
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 md:px-10 py-10">
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/' },
            { label: 'Parent Dashboard' },
          ]}
          className="mb-6"
        />
        <AnnouncementBanner />
        {error && <ErrorMessage message={error} onRetry={fetchData} />}

        <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
          <h1 className="font-display text-2xl md:text-[30px] font-bold text-navy">
            Welcome back, {profile?.full_name ?? 'Parent'}! 👋
          </h1>
          <span className="bg-teal/10 text-teal text-sm font-bold px-4 py-1.5 rounded-full capitalize">
            {planLabel} plan
          </span>
        </div>

        <section className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-2xl font-bold text-navy">Your Children</h2>
            <Link
              to="/children/new"
              className="bg-gold text-white px-5 py-2 rounded-full text-sm font-extrabold hover:opacity-90 transition-opacity no-underline"
            >
              + Add Child
            </Link>
          </div>

          {children.length === 0 ? (
            <p className="text-muted text-center py-8 bg-white rounded-2xl border border-gray-200">
              No children added yet. Click &quot;Add Child&quot; to get started!
            </p>
          ) : analyticsLoading ? (
            <DashboardSkeleton />
          ) : (
            <div className="space-y-4">
              {children.map((child) => (
                <ChildAnalyticsCard
                  key={child.id}
                  child={child}
                  analytics={analyticsMap[child.id] ?? {
                    childId: child.id,
                    totalStars: 0,
                    currentStreak: 0,
                    longestStreak: 0,
                    articlesCompleted: 0,
                    quizzesPassed: 0,
                    badgesEarned: 0,
                    lastActive: null,
                    mostActivePillar: null,
                    hasActivity: false,
                  }}
                />
              ))}
            </div>
          )}
        </section>

        <DiscovererReportSection />

        <section className="mb-10">
          <h2 className="font-display text-2xl font-bold text-navy mb-5">Recent Learning Activity</h2>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {recentActivity.length === 0 ? (
              <p className="text-muted text-center py-8">No activity yet.</p>
            ) : (
              recentActivity.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-5 py-4 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-bold text-navy text-sm">
                      {(item.article as { title?: string })?.title ?? 'Article'}
                    </p>
                    <p className="text-xs text-muted">
                      {(item.child as { name?: string })?.name ?? 'Child'} ·{' '}
                      {item.completed_date
                        ? new Date(item.completed_date).toLocaleDateString()
                        : ''}
                    </p>
                  </div>
                  <span className="text-teal font-extrabold text-sm">✓ Complete</span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="mb-10 bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-display text-xl font-bold text-navy mb-2">Account</h2>
          <p className="text-muted mb-4 text-sm leading-relaxed">
            Manage your parent account password and sign-in security.
          </p>
          <Link
            to="/parent/account"
            className="inline-flex border-2 border-navy text-navy px-6 py-2 rounded-full text-sm font-bold hover:bg-navy/5 transition-colors no-underline"
          >
            Account & Password
          </Link>
        </section>

        <section className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-display text-xl font-bold text-navy mb-4">Subscription</h2>
          <p className="text-muted mb-1">Current plan: <span className="font-bold text-navy capitalize">{planLabel}</span></p>
          {subscription?.end_date && (
            <p className="text-muted mb-4">Renewal: {subscription.end_date}</p>
          )}
          <button
            onClick={() => navigate('/pricing')}
            className="border-2 border-navy text-navy px-6 py-2 rounded-full text-sm font-bold hover:bg-navy/5 transition-colors"
          >
            Manage Subscription
          </button>
        </section>
      </div>
    </div>
  )
}

async function supabaseSignOut() {
  const { supabase } = await import('../lib/supabase')
  await supabase.auth.signOut()
  window.location.href = '/login'
}
