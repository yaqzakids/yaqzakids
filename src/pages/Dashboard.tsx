import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../components/ProtectedRoute'
import { getProfile, getChildProfiles, getSubscription, getRecentProgress, createChildProfile, updateChildProfile } from '../lib/supabase'
import { fetchChildDashboardAnalytics } from '../lib/adventure/engagement'
import type { ChildProfile, Profile, Progress, Subscription, AgeGroup, Language } from '../lib/types'
import type { ChildDashboardAnalytics } from '../lib/adventure/types'
import ChildAnalyticsCard from '../components/dashboard/ChildAnalyticsCard'
import DashboardSkeleton from '../components/dashboard/DashboardSkeleton'
import ErrorMessage from '../components/ErrorMessage'
import AvatarSelectorModal from '../components/avatar/AvatarSelectorModal'
import UserAvatar from '../components/UserAvatar'
import { isPresetAvatarId, type PresetAvatarId } from '../lib/avatar/presetAvatars'
import { formatSupabaseError } from '../lib/supabaseErrors'
import AnnouncementBanner from '@/components/messaging/AnnouncementBanner'
import ParentNavLinks from '@/components/messaging/ParentNavLinks'
import { DiscovererReportSection } from '@/components/dashboard/DiscovererReportTab'

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
  const [showModal, setShowModal] = useState(false)
  const [editingChild, setEditingChild] = useState<ChildProfile | null>(null)
  const [newChildName, setNewChildName] = useState('')
  const [newChildAgeGroup, setNewChildAgeGroup] = useState<AgeGroup>('explorer')
  const [newChildAvatarId, setNewChildAvatarId] = useState<PresetAvatarId | null>(null)
  const [editChildName, setEditChildName] = useState('')
  const [editChildAgeGroup, setEditChildAgeGroup] = useState<AgeGroup>('explorer')
  const [editChildAvatarId, setEditChildAvatarId] = useState<PresetAvatarId | null>(null)
  const [addingChild, setAddingChild] = useState(false)
  const [savingChild, setSavingChild] = useState(false)
  const [avatarSelectorTarget, setAvatarSelectorTarget] = useState<'new' | 'edit' | null>(null)

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

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setAddingChild(true)
    try {
      await createChildProfile({
        parent_id: user.id,
        name: newChildName,
        age_group: newChildAgeGroup,
        avatar: null,
        avatar_id: newChildAvatarId,
        language: (profile?.language ?? 'en') as Language,
      })
      setShowModal(false)
      setNewChildName('')
      setNewChildAvatarId(null)
      fetchData()
    } catch (err) {
      console.log('avatar save error:', err)
      setError(formatSupabaseError(err))
    } finally {
      setAddingChild(false)
    }
  }

  const openEditChild = (child: ChildProfile) => {
    setEditingChild(child)
    setEditChildName(child.name)
    setEditChildAgeGroup(child.age_group)
    setEditChildAvatarId(isPresetAvatarId(child.avatar_id) ? child.avatar_id : null)
  }

  const handleSaveChild = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingChild) return
    setSavingChild(true)
    try {
      await updateChildProfile(editingChild.id, {
        name: editChildName,
        age_group: editChildAgeGroup,
        avatar_id: editChildAvatarId,
      })
      setEditingChild(null)
      fetchData()
    } catch (err) {
      console.log('avatar save error:', err)
      setError(formatSupabaseError(err))
    } finally {
      setSavingChild(false)
    }
  }

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
      <nav className="bg-white border-b border-gray-200 px-6 md:px-10 h-16 flex items-center justify-between">
        <ParentNavLinks />
        <button
          onClick={() => supabaseSignOut()}
          className="text-sm text-muted hover:text-navy transition-colors"
        >
          Sign Out
        </button>
      </nav>

      <div className="max-w-5xl mx-auto px-6 md:px-10 py-10">
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
            <button
              onClick={() => setShowModal(true)}
              className="bg-gold text-white px-5 py-2 rounded-full text-sm font-extrabold hover:opacity-90 transition-opacity"
            >
              + Add Child
            </button>
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
                  onEdit={openEditChild}
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

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 overflow-y-auto py-8">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="font-display text-xl font-bold text-navy mb-5">Add a Child</h3>
            <form onSubmit={handleAddChild} className="space-y-4">
              <input
                type="text"
                placeholder="Child's name"
                value={newChildName}
                onChange={(e) => setNewChildName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-teal focus:outline-none"
              />
              <select
                value={newChildAgeGroup}
                onChange={(e) => setNewChildAgeGroup(e.target.value as AgeGroup)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-teal focus:outline-none bg-white"
              >
                <option value="explorer">Explorer (Ages 5–8)</option>
                <option value="discoverer">Discoverer (Ages 9–12)</option>
                <option value="thinker">Thinker (Ages 13–16)</option>
              </select>
              <div>
                <p className="text-sm font-bold text-navy mb-3">Avatar</p>
                <div className="flex items-center gap-4">
                  <UserAvatar name={newChildName || 'Child'} avatarId={newChildAvatarId} size={56} />
                  <button
                    type="button"
                    onClick={() => setAvatarSelectorTarget('new')}
                    className="px-4 py-2 border-2 border-navy text-navy rounded-full text-sm font-bold hover:bg-navy/5 transition-colors"
                  >
                    Choose Avatar
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setNewChildAvatarId(null)
                  }}
                  className="flex-1 py-3 border border-gray-200 rounded-full font-bold text-muted"
                >
                  Cancel
                </button>
                <button type="submit" disabled={addingChild} className="flex-1 py-3 bg-gold text-white rounded-full font-extrabold disabled:opacity-50">
                  {addingChild ? 'Adding...' : 'Add Child'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingChild && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 overflow-y-auto py-8">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="font-display text-xl font-bold text-navy mb-5">Edit Child Profile</h3>
            <form onSubmit={handleSaveChild} className="space-y-4">
              <input
                type="text"
                placeholder="Child's name"
                value={editChildName}
                onChange={(e) => setEditChildName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-teal focus:outline-none"
              />
              <select
                value={editChildAgeGroup}
                onChange={(e) => setEditChildAgeGroup(e.target.value as AgeGroup)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-teal focus:outline-none bg-white"
              >
                <option value="explorer">Explorer (Ages 5–8)</option>
                <option value="discoverer">Discoverer (Ages 9–12)</option>
                <option value="thinker">Thinker (Ages 13–16)</option>
              </select>
              <div>
                <p className="text-sm font-bold text-navy mb-3">Avatar</p>
                <div className="flex items-center gap-4">
                  <UserAvatar name={editChildName || 'Child'} avatarId={editChildAvatarId} size={56} />
                  <button
                    type="button"
                    onClick={() => setAvatarSelectorTarget('edit')}
                    className="px-4 py-2 border-2 border-navy text-navy rounded-full text-sm font-bold hover:bg-navy/5 transition-colors"
                  >
                    Choose Avatar
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingChild(null)} className="flex-1 py-3 border border-gray-200 rounded-full font-bold text-muted">
                  Cancel
                </button>
                <button type="submit" disabled={savingChild} className="flex-1 py-3 bg-gold text-white rounded-full font-extrabold disabled:opacity-50">
                  {savingChild ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AvatarSelectorModal
        open={avatarSelectorTarget !== null}
        selectedId={avatarSelectorTarget === 'new' ? newChildAvatarId : editChildAvatarId}
        onClose={() => setAvatarSelectorTarget(null)}
        onSave={(avatarId) => {
          if (avatarSelectorTarget === 'new') {
            setNewChildAvatarId(avatarId)
          } else if (avatarSelectorTarget === 'edit') {
            setEditChildAvatarId(avatarId)
          }
          setAvatarSelectorTarget(null)
        }}
        variant="default"
      />
    </div>
  )
}

async function supabaseSignOut() {
  const { supabase } = await import('../lib/supabase')
  await supabase.auth.signOut()
  window.location.href = '/login'
}
