import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/components/ProtectedRoute'
import { useSelectedChild } from '@/context/SelectedChildContext'
import ParentLayout from '@/components/layout/ParentLayout'
import ChildProfileCard from '@/components/children/ChildProfileCard'
import BrandLogo from '@/components/BrandLogo'
import LoadingSpinner from '@/components/LoadingSpinner'
import { fetchAllChildProfileSummaries, profilePathForAgeGroup, type ChildProfileSummary } from '@/lib/childProfiles'
import { readRedirectParam, normalizeChildHomeRedirect } from '@/lib/navigation'
import { getChildProfilesReliably } from '@/lib/supabase'

/** Child picker — shown after login when the family has 2+ child profiles. */
export default function ChildrenPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const redirectTo = readRedirectParam(searchParams.toString())
  const forcePicker = searchParams.get('pick') === '1'
  const {
    children,
    selectedChild,
    activeChildProfileId,
    enterChildExperience,
    refreshChildren,
    loading,
  } = useSelectedChild()
  const [summaries, setSummaries] = useState<ChildProfileSummary[]>([])
  const [summariesLoading, setSummariesLoading] = useState(true)
  const [confirmingEmpty, setConfirmingEmpty] = useState(false)
  const [emptyConfirmed, setEmptyConfirmed] = useState(false)

  useEffect(() => {
    if (loading || confirmingEmpty) return

    if (children.length === 0) {
      if (!user?.id) return

      let cancelled = false
      setConfirmingEmpty(true)
      void getChildProfilesReliably(user.id)
        .then((rows) => {
          if (cancelled) return
          if (rows.length === 0) {
            setEmptyConfirmed(true)
            return
          }
          if (rows.length === 1 && !forcePicker) {
            enterChildExperience(rows[0].id)
            const profile = profilePathForAgeGroup(rows[0].age_group)
            const destination = redirectTo ? normalizeChildHomeRedirect(redirectTo) : profile
            navigate(destination, { replace: true })
            return
          }
          void refreshChildren()
        })
        .catch(() => {
          if (!cancelled) setEmptyConfirmed(true)
        })
        .finally(() => {
          if (!cancelled) setConfirmingEmpty(false)
        })
      return () => {
        cancelled = true
      }
    }

    if (children.length === 1 && !forcePicker) {
      enterChildExperience(children[0].id)
      const profile = profilePathForAgeGroup(children[0].age_group)
      const destination = redirectTo ? normalizeChildHomeRedirect(redirectTo) : profile
      navigate(destination, { replace: true })
    }
  }, [loading, confirmingEmpty, children, forcePicker, redirectTo, navigate, enterChildExperience, refreshChildren, user?.id])

  useEffect(() => {
    if (loading || children.length < 2) {
      setSummaries([])
      setSummariesLoading(false)
      return
    }

    let cancelled = false
    setSummariesLoading(true)
    void fetchAllChildProfileSummaries(children).then((rows) => {
      if (!cancelled) {
        setSummaries(rows)
        setSummariesLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [children, loading])

  const handleEnter = (childId: string) => {
    const child = children.find((c) => c.id === childId)
    enterChildExperience(childId)
    const profile = child ? profilePathForAgeGroup(child.age_group) : '/profile'
    const destination = redirectTo ? normalizeChildHomeRedirect(redirectTo) : profile
    navigate(destination, { replace: true })
  }

  if (loading || confirmingEmpty) {
    return (
      <div className="min-h-screen bg-[#EEF4FF] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (emptyConfirmed || children.length === 0) {
    return (
      <ParentLayout active="children" bg="bg-[#EEF4FF]">
        <div className="max-w-lg mx-auto px-6 py-16 text-center">
          <BrandLogo height={44} className="mx-auto mb-6" />
          <h1 className="font-display text-2xl font-bold text-[#1B2F5E] mb-3">
            No child profiles yet
          </h1>
          <p className="text-[#1B2F5E]/70 leading-relaxed mb-8">
            Add your first child when you&apos;re ready — or sign in again if you already have profiles.
          </p>
          <button
            type="button"
            onClick={() => navigate('/children/new')}
            className="px-8 py-3.5 bg-gold text-white rounded-full text-base font-extrabold hover:opacity-90"
          >
            Add a child →
          </button>
        </div>
      </ParentLayout>
    )
  }

  if (children.length <= 1 || summariesLoading) {
    return (
      <div className="min-h-screen bg-[#EEF4FF] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <ParentLayout active="children" bg="bg-[#EEF4FF]">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <BrandLogo height={44} className="mb-4" />
          <h1 className="font-display text-2xl md:text-3xl font-bold text-[#1B2F5E]">
            Who&apos;s learning today?
          </h1>
          <p className="text-[#1B2F5E]/70 max-w-xl leading-relaxed mt-3">
            Each child gets their own stars, streaks, paths, and progress. Tap a profile to enter their
            personalized learning world.
          </p>
        </div>

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

        {selectedChild && (
          <p className="text-center text-sm text-[#6B7280] mt-8">
            Last active: <span className="font-bold text-[#1B2F5E]">{selectedChild.name}</span>
          </p>
        )}
      </div>
    </ParentLayout>
  )
}
