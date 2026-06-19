import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSelectedChild } from '@/context/SelectedChildContext'
import ParentLayout from '@/components/layout/ParentLayout'
import ChildProfileCard from '@/components/children/ChildProfileCard'
import BrandLogo from '@/components/BrandLogo'
import LoadingSpinner from '@/components/LoadingSpinner'
import { fetchAllChildProfileSummaries, profilePathForAgeGroup, type ChildProfileSummary } from '@/lib/childProfiles'
import { ADD_CHILD_PATH } from '@/lib/parent/postLoginNavigation'
import { readRedirectParam, normalizeChildHomeRedirect } from '@/lib/navigation'

/** Child picker — or add-child for families with no profiles yet. */
export default function ChildrenPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = readRedirectParam(searchParams.toString())
  const forcePicker = searchParams.get('pick') === '1'
  const {
    children,
    selectedChild,
    activeChildProfileId,
    enterChildExperience,
    loading,
  } = useSelectedChild()
  const [summaries, setSummaries] = useState<ChildProfileSummary[]>([])
  const [summariesLoading, setSummariesLoading] = useState(true)

  useEffect(() => {
    if (loading || forcePicker) return

    if (children.length === 0) {
      navigate(ADD_CHILD_PATH, { replace: true })
      return
    }

    if (children.length === 1) {
      enterChildExperience(children[0].id)
      const profile = profilePathForAgeGroup(children[0].age_group)
      const destination = redirectTo ? normalizeChildHomeRedirect(redirectTo) : profile
      navigate(destination, { replace: true })
    }
  }, [loading, children, forcePicker, redirectTo, navigate, enterChildExperience])

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

  if (loading || children.length <= 1 || summariesLoading) {
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
