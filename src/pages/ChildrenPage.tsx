import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/components/ProtectedRoute'
import { useSelectedChild } from '@/context/SelectedChildContext'
import ParentLayout from '@/components/layout/ParentLayout'
import ChildProfileCard from '@/components/children/ChildProfileCard'
import LoadingSpinner from '@/components/LoadingSpinner'
import { fetchAllChildProfileSummaries, type ChildProfileSummary } from '@/lib/childProfiles'
import { readRedirectParam, normalizeChildHomeRedirect } from '@/lib/navigation'

export default function ChildrenPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = readRedirectParam(searchParams.toString())
  const { user, loading: authLoading } = useAuth()
  const {
    children,
    selectedChild,
    activeChildProfileId,
    loading: childLoading,
    enterChildExperience,
  } = useSelectedChild()
  const [summaries, setSummaries] = useState<ChildProfileSummary[]>([])
  const [loadingSummaries, setLoadingSummaries] = useState(true)

  useEffect(() => {
    if (authLoading || childLoading) return
    if (!user) return

    let cancelled = false
    setLoadingSummaries(true)
    fetchAllChildProfileSummaries(children)
      .then((rows) => {
        if (!cancelled) setSummaries(rows)
      })
      .finally(() => {
        if (!cancelled) setLoadingSummaries(false)
      })

    return () => {
      cancelled = true
    }
  }, [children, authLoading, childLoading, user])

  const handleEnter = (childId: string) => {
    const home = enterChildExperience(childId)
    const destination = redirectTo ? normalizeChildHomeRedirect(redirectTo) : home
    navigate(destination, { replace: true })
  }

  if (authLoading || childLoading) {
    return (
      <div className="min-h-screen bg-[#EEF4FF] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#EEF4FF] flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-[#1B2F5E] font-bold mb-4">Sign in to choose a child profile.</p>
          <Link to="/login" className="text-[#2AAFA0] font-extrabold hover:underline">
            Sign in →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <ParentLayout active="children" bg="bg-[#EEF4FF]">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <p className="text-[#2AAFA0] text-xs font-extrabold tracking-widest uppercase mb-2">YaqzaKids</p>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-[#1B2F5E]">
            Who&apos;s learning today?
          </h1>
          <p className="text-[#1B2F5E]/70 max-w-xl leading-relaxed mt-3">
            Each child gets their own stars, streaks, paths, and progress. Tap a profile to enter their
            personalized learning world.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-4 mb-8">
          <Link
            to="/children/new"
            className="inline-flex px-5 py-2.5 bg-[#F5A623] text-white rounded-full text-sm font-extrabold hover:opacity-90 shrink-0"
          >
            + Add child
          </Link>
        </div>

        {loadingSummaries ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : children.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
            <p className="text-4xl mb-3" aria-hidden>👨‍👩‍👧‍👦</p>
            <h2 className="font-display text-xl font-bold text-[#1B2F5E] mb-2">Create your first child profile.</h2>
            <p className="text-[#6B7280] mb-6">Add a child to start their personalized learning journey.</p>
            <Link
              to="/children/new"
              className="inline-flex px-6 py-3 bg-[#2AAFA0] text-white rounded-full font-extrabold hover:opacity-90"
            >
              Add a child
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-6">
            {summaries.map((summary) => (
              <ChildProfileCard
                key={summary.childId}
                summary={summary}
                onEnter={handleEnter}
                onEdit={(id) => navigate(`/children/${id}/edit`)}
                isActive={activeChildProfileId === summary.childId}
              />
            ))}
          </div>
        )}

        {selectedChild && (
          <p className="text-center text-sm text-[#6B7280] mt-8">
            Currently active: <span className="font-bold text-[#1B2F5E]">{selectedChild.name}</span>
            {' · '}
            <button
              type="button"
              onClick={() => handleEnter(selectedChild.id)}
              className="text-[#2AAFA0] font-extrabold hover:underline"
            >
              Continue as {selectedChild.name}
            </button>
          </p>
        )}
      </div>
    </ParentLayout>
  )
}
