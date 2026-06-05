import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../components/ProtectedRoute'
import { getProfile, getChildProfiles, getSubscription, getRecentProgress, createChildProfile } from '../lib/supabase'
import { IMAGES } from '../lib/constants'
import type { ChildProfile, Profile, Progress, Subscription, AgeGroup } from '../lib/types'
import ChildCard from '../components/dashboard/ChildCard'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [children, setChildren] = useState<ChildProfile[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [recentActivity, setRecentActivity] = useState<Progress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [newChildName, setNewChildName] = useState('')
  const [newChildAgeGroup, setNewChildAgeGroup] = useState<AgeGroup>('explorer')
  const [addingChild, setAddingChild] = useState(false)

  const fetchData = async () => {
    if (!user) return
    setLoading(true)
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

      const activity = await getRecentProgress(kids.map((c) => c.id))
      setRecentActivity(activity)
    } catch {
      setError('Failed to load dashboard data.')
    } finally {
      setLoading(false)
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
        language: profile?.language ?? 'en',
      })
      setShowModal(false)
      setNewChildName('')
      fetchData()
    } catch {
      setError('Failed to add child.')
    } finally {
      setAddingChild(false)
    }
  }

  const planLabel = subscription?.plan?.replace('_', ' ') ?? 'free'

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg page-transition">
      <nav className="bg-white border-b border-gray-200 px-6 md:px-10 h-16 flex items-center justify-between">
        <Link to="/"><img src={IMAGES.logo} alt="Yaqza Kids" className="h-12" /></Link>
        <button
          onClick={() => supabaseSignOut()}
          className="text-sm text-muted hover:text-navy transition-colors"
        >
          Sign Out
        </button>
      </nav>

      <div className="max-w-5xl mx-auto px-6 md:px-10 py-10">
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
              No children added yet. Click "Add Child" to get started!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {children.map((child) => (
                <ChildCard
                  key={child.id}
                  child={child}
                  onViewProgress={(id) => navigate(`/child-dashboard?child=${id}`)}
                />
              ))}
            </div>
          )}
        </section>

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
                      {(item.article as { title_en?: string })?.title_en ?? 'Article'}
                    </p>
                    <p className="text-xs text-muted">
                      {(item.child as { name?: string })?.name ?? 'Child'} · {item.completed_date}
                    </p>
                  </div>
                  <span className="text-gold font-extrabold text-sm">+{item.xp_earned} XP</span>
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
          <button className="border-2 border-navy text-navy px-6 py-2 rounded-full text-sm font-bold hover:bg-navy/5 transition-colors">
            Manage Subscription
          </button>
        </section>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
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
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border border-gray-200 rounded-full font-bold text-muted">
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
    </div>
  )
}

async function supabaseSignOut() {
  const { supabase } = await import('../lib/supabase')
  await supabase.auth.signOut()
  window.location.href = '/login'
}
