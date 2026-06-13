import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/components/ProtectedRoute'
import { useSelectedChild } from '@/context/SelectedChildContext'
import LoadingSpinner from '@/components/LoadingSpinner'
import { AGE_GROUP_META, dashboardPathForAgeGroup } from '@/lib/childProfiles'
import { clearPendingAgeGroupChild } from '@/lib/onboarding'
import { updateChildProfile } from '@/lib/supabase'
import { STORAGE_KEYS } from '@/lib/constants'
import type { AgeGroup } from '@/lib/types'

const GROUPS: AgeGroup[] = ['explorer', 'discoverer', 'thinker']

export default function ChooseAgeGroupPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const childId = searchParams.get('childId')
  const { user, loading: authLoading } = useAuth()
  const { children, enterChildExperience, loading: childLoading } = useSelectedChild()
  const [saving, setSaving] = useState<AgeGroup | null>(null)
  const [error, setError] = useState<string | null>(null)

  const child = childId ? children.find((c) => c.id === childId) : null

  useEffect(() => {
    if (authLoading || childLoading) return
    if (!user) {
      navigate('/login', { replace: true })
      return
    }
    if (!childId || !child) {
      navigate('/children/new?onboarding=1', { replace: true })
    }
  }, [authLoading, childLoading, user, childId, child, navigate])

  const handleChoose = async (ageGroup: AgeGroup) => {
    if (!child) return
    setSaving(ageGroup)
    setError(null)
    try {
      await updateChildProfile(child.id, { age_group: ageGroup })
      localStorage.setItem(STORAGE_KEYS.ageGroup, ageGroup)
      enterChildExperience(child.id)
      clearPendingAgeGroupChild()
      navigate(dashboardPathForAgeGroup(ageGroup), { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save learning path.')
    } finally {
      setSaving(null)
    }
  }

  if (authLoading || childLoading || !child) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg page-transition px-4 py-10">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-teal text-xs font-extrabold tracking-widest uppercase mb-2">Almost there</p>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-navy mb-2">
          Choose a learning path for {child.name}
        </h1>
        <p className="text-muted mb-8 max-w-xl mx-auto leading-relaxed">
          Pick Explorer, Discoverer, or Thinker based on your child&apos;s age and reading level.
        </p>

        {error && <p className="text-coral font-semibold mb-6">{error}</p>}

        <div className="grid md:grid-cols-3 gap-5">
          {GROUPS.map((group) => {
            const meta = AGE_GROUP_META[group]
            return (
              <button
                key={group}
                type="button"
                disabled={Boolean(saving)}
                onClick={() => handleChoose(group)}
                className="bg-white rounded-2xl border-2 p-6 text-left shadow-sm hover:shadow-md transition-shadow disabled:opacity-60"
                style={{ borderColor: meta.accent }}
              >
                <p className="text-3xl mb-3">{meta.emoji}</p>
                <h2 className="font-display text-xl font-bold text-navy mb-1">{meta.label}</h2>
                <p className="text-sm font-bold mb-3" style={{ color: meta.accent }}>
                  Ages {meta.ages}
                </p>
                <p className="text-sm text-muted leading-relaxed">
                  {saving === group ? 'Starting…' : `Enter ${meta.label} dashboard →`}
                </p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
