import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../components/ProtectedRoute'
import { useSelectedChild } from '@/context/SelectedChildContext'
import { getProfile, getChildProfiles, getSubscription, getRecentProgress } from '../lib/supabase'
import { fetchChildDashboardAnalytics } from '../lib/adventure/engagement'
import { fetchChildCertificates } from '@/lib/discoverer'
import type { ChildProfile, Profile, Progress, Subscription } from '../lib/types'
import type { ChildDashboardAnalytics } from '../lib/adventure/types'
import ChildAnalyticsCard from '../components/dashboard/ChildAnalyticsCard'
import DashboardSkeleton from '../components/dashboard/DashboardSkeleton'
import ErrorMessage from '../components/ErrorMessage'
import AnnouncementBanner from '@/components/messaging/AnnouncementBanner'
import ParentLayout from '@/components/layout/ParentLayout'
import Breadcrumbs from '@/components/navigation/Breadcrumbs'
import ParentPasscodeGate from '@/components/parent/ParentPasscodeGate'
import ParentGateLink from '@/components/parent/ParentGateLink'
import DailyFaithPracticeSection from '@/components/islamic/DailyFaithPracticeSection'
import { AGE_GROUP_META } from '@/lib/childProfiles'
import { getLevelProgress } from '@/lib/adventure/levels'
import { formatSupabaseError } from '../lib/supabaseErrors'

function getErrorMessage(err: unknown): string {
  return formatSupabaseError(err)
}

function SubscriptionSection({
  subscription,
  planLabel,
}: {
  subscription: Subscription | null
  planLabel: string
}) {
  const navigate = useNavigate()

  return (
    <ParentPasscodeGate alwaysRequire>
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-display text-xl font-bold text-navy mb-2">Subscription & Billing</h2>
        <p className="text-muted mb-4 text-sm leading-relaxed">
          Manage your family plan, payment methods, and billing history.
        </p>
        {subscription?.plan && subscription.plan !== 'free' ? (
          <>
            <p className="text-muted mb-1">
              Current plan: <span className="font-bold text-navy capitalize">{planLabel}</span>
            </p>
            {subscription.end_date && (
              <p className="text-muted mb-4">Renewal: {subscription.end_date}</p>
            )}
            <button
              type="button"
              onClick={() => navigate('/pricing')}
              className="border-2 border-navy text-navy px-6 py-2 rounded-full text-sm font-bold hover:bg-navy/5 transition-colors"
            >
              Update plan
            </button>
          </>
        ) : (
          <div className="text-center py-6">
            <p className="text-3xl mb-2" aria-hidden>💳</p>
            <p className="text-muted mb-4">Choose a family plan when subscriptions launch.</p>
            <p className="text-xs text-[#6B7280] mb-4">Stripe is not connected yet.</p>
            <Link
              to="/pricing"
              className="inline-flex border-2 border-navy text-navy px-6 py-2 rounded-full text-sm font-bold hover:bg-navy/5 no-underline"
            >
              View plans
            </Link>
          </div>
        )}
      </section>
    </ParentPasscodeGate>
  )
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth()
  const { selectedChild, enterChildExperience } = useSelectedChild()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [children, setChildren] = useState<ChildProfile[]>([])
  const [analyticsMap, setAnalyticsMap] = useState<Record<string, ChildDashboardAnalytics>>({})
  const [certificateCounts, setCertificateCounts] = useState<Record<string, number>>({})
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

      const certCounts: Record<string, number> = {}
      await Promise.all(
        kids.map(async (c) => {
          const certs = await fetchChildCertificates(c.id)
          certCounts[c.id] = certs.length
        })
      )
      setCertificateCounts(certCounts)
    } catch (err) {
      console.error('Dashboard fetch failed:', err)
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
      <ParentLayout active="dashboard">
        <div className="max-w-5xl mx-auto px-6 md:px-10 py-10">
          <div className="h-8 bg-gray-200 rounded w-64 mb-10 animate-pulse" />
          <DashboardSkeleton />
        </div>
      </ParentLayout>
    )
  }

  return (
    <ParentLayout active="dashboard">
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
          <div>
            <p className="text-[#2AAFA0] text-xs font-extrabold tracking-widest uppercase mb-1">
              Family Account
            </p>
            <h1 className="font-display text-2xl md:text-[30px] font-bold text-navy">
              Welcome back, {profile?.full_name ?? 'Parent'}! 👋
            </h1>
          </div>
          <Link
            to="/children"
            className="inline-flex px-5 py-2 bg-gold text-white rounded-full text-sm font-extrabold hover:opacity-90 no-underline"
          >
            My Children
          </Link>
        </div>

        {/* A. Family Overview */}
        <section className="mb-10">
          <h2 className="font-display text-2xl font-bold text-navy mb-5">Family Overview</h2>
          {children.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
              <p className="text-4xl mb-3" aria-hidden>👨‍👩‍👧‍👦</p>
              <p className="font-bold text-navy mb-2">Create your first child profile.</p>
              <p className="text-muted mb-6">Add a child to start their learning journey.</p>
              <Link
                to="/children/new"
                className="inline-flex bg-[#2AAFA0] text-white px-6 py-3 rounded-full font-extrabold hover:opacity-90 no-underline"
              >
                + Add Child
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {children.map((child) => {
                const meta = AGE_GROUP_META[child.age_group]
                const analytics = analyticsMap[child.id]
                const levelName = getLevelProgress(analytics?.totalStars ?? 0).currentLevel
                const isActive = selectedChild?.id === child.id
                return (
                  <div
                    key={child.id}
                    className={`bg-white rounded-2xl border p-5 shadow-sm ${
                      isActive ? 'border-[#2AAFA0] ring-2 ring-[#2AAFA0]/20' : 'border-gray-200'
                    }`}
                  >
                    <p className="font-bold text-navy truncate">{child.name}</p>
                    <p className="text-xs font-bold mt-1" style={{ color: meta.accent }}>
                      {meta.label} · {levelName}
                    </p>
                    <p className="text-xs text-muted mt-2">
                      ⭐ {analytics?.totalStars ?? 0} · 🔥 {analytics?.currentStreak ?? 0} day streak
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const path = enterChildExperience(child.id)
                        navigate(path)
                      }}
                      className="mt-4 w-full py-2 rounded-full text-sm font-extrabold text-white"
                      style={{ background: meta.accent }}
                    >
                      {isActive ? 'Continue' : 'Enter profile'}
                    </button>
                  </div>
                )
              })}
              <Link
                to="/children/new"
                className="bg-[#EEF4FF] rounded-2xl border-2 border-dashed border-[#2AAFA0]/40 p-5 flex flex-col items-center justify-center min-h-[140px] hover:bg-[#EEF4FF]/80 no-underline"
              >
                <span className="text-3xl mb-2">+</span>
                <span className="font-bold text-[#2AAFA0]">Add Child</span>
              </Link>
            </div>
          )}
        </section>

        {/* B. Child Progress */}
        <section className="mb-10">
          <h2 className="font-display text-2xl font-bold text-navy mb-5">Child Progress</h2>
          {children.length === 0 ? null : analyticsLoading ? (
            <DashboardSkeleton />
          ) : (
            <div className="space-y-4">
              {children.map((child) => {
                const analytics = analyticsMap[child.id] ?? {
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
                }
                const certCount = certificateCounts[child.id] ?? 0
                return (
                  <div key={child.id} className="space-y-2">
                    <ChildAnalyticsCard child={child} analytics={analytics} />
                    <p className="text-xs text-muted px-1">
                      {certCount > 0
                        ? `${certCount} certificate${certCount === 1 ? '' : 's'} earned`
                        : 'Complete a learning path to earn your first certificate.'}
                    </p>
                  </div>
                )
              })}
              {children.every((c) => !analyticsMap[c.id]?.hasActivity) && (
                <p className="text-muted text-center py-4 bg-white rounded-2xl border border-gray-200">
                  Your child has not started learning yet.
                </p>
              )}
            </div>
          )}
        </section>

        {/* Daily faith practice for the family */}
        {children.length > 0 && (
          <section className="mb-10">
            <h2 className="font-display text-2xl font-bold text-navy mb-5">Faith at Home</h2>
            <DailyFaithPracticeSection
              childId={selectedChild?.id ?? children[0]?.id ?? null}
              showMarkComplete={false}
            />
          </section>
        )}

        {/* E. Messages & Announcements */}
        <section className="mb-10 bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="font-display text-xl font-bold text-navy">Parent Messages & Announcements</h2>
            <ParentGateLink to="/parent/messages" className="text-teal text-sm font-extrabold no-underline">
              View all →
            </ParentGateLink>
          </div>
          <p className="text-muted text-sm mb-4">
            Admin announcements, support updates, and family account notices appear here.
          </p>
          <AnnouncementBanner />
          <p className="text-sm text-muted text-center py-4 mt-2">
            No parent messages yet? Check back for updates from the YaqzaKids team.
          </p>
        </section>

        {/* F. Subscription */}
        <section className="mb-10">
          <SubscriptionSection subscription={subscription} planLabel={planLabel} />
        </section>

        {/* G. Support */}
        <section className="mb-10 bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-display text-xl font-bold text-navy mb-2">Support</h2>
          <p className="text-muted text-sm mb-4">Get help with your account, billing, or learning paths.</p>
          <div className="flex flex-wrap gap-3">
            <ParentGateLink
              to="/support"
              className="inline-flex border-2 border-navy text-navy px-5 py-2 rounded-full text-sm font-bold hover:bg-navy/5 no-underline"
            >
              Contact support
            </ParentGateLink>
            <Link
              to="/parents"
              className="inline-flex border-2 border-gray-200 text-navy px-5 py-2 rounded-full text-sm font-bold hover:bg-gray-50 no-underline"
            >
              Help center
            </Link>
          </div>
        </section>

        {/* Account settings link */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-display text-xl font-bold text-navy mb-2">Account Settings</h2>
          <p className="text-muted mb-4 text-sm leading-relaxed">
            Manage your parent account, password, and passcode.
          </p>
          <ParentGateLink
            to="/account/settings"
            className="inline-flex border-2 border-navy text-navy px-6 py-2 rounded-full text-sm font-bold hover:bg-navy/5 transition-colors no-underline"
          >
            Account settings
          </ParentGateLink>
        </section>

        {/* Recent activity */}
        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold text-navy mb-5">Recent Learning Activity</h2>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {recentActivity.length === 0 ? (
              <p className="text-muted text-center py-8">Your child has not started learning yet.</p>
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
      </div>
    </ParentLayout>
  )
}
